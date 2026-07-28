import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { BillingInterval, PaymentStatus, SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { WompiService, WompiWebhookPayload } from './wompi.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { SyncCheckoutDto } from './dto/sync-checkout.dto';

const ACTIVE_SUB_STATUSES: SubscriptionStatus[] = [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING];
const WOMPI_APPROVED = 'APPROVED';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly wompi: WompiService,
  ) {}

  async listPlans(user: AuthenticatedUser) {
    if (!user.tenantId) return [];
    return this.prisma.plan.findMany({ where: { tenantId: user.tenantId, isActive: true }, orderBy: { price: 'asc' } });
  }

  async getMySubscription(userId: string) {
    return this.prisma.subscription.findFirst({
      where: { userId, status: { in: ACTIVE_SUB_STATUSES } },
      include: { plan: true },
      orderBy: { startDate: 'desc' },
    });
  }

  async listMyInvoices(userId: string) {
    return this.prisma.payment.findMany({ where: { userId }, include: { plan: true }, orderBy: { createdAt: 'desc' } });
  }

  async createCheckout(user: AuthenticatedUser, dto: CreateCheckoutDto) {
    const plan = await this.prisma.plan.findUnique({ where: { id: dto.planId } });
    if (!plan || !plan.isActive || plan.tenantId !== user.tenantId) {
      throw new NotFoundException('Plan no encontrado');
    }
    if (plan.currency !== 'COP') {
      throw new BadRequestException('Wompi solo admite pagos en COP; este plan no está configurado en pesos colombianos');
    }

    const reference = `sub_${randomUUID()}`;
    const amountInCents = Math.round(Number(plan.price) * 100);

    const payment = await this.prisma.payment.create({
      data: {
        userId: user.id,
        planId: plan.id,
        reference,
        amount: plan.price,
        currency: plan.currency,
        status: PaymentStatus.PENDING,
        provider: 'wompi',
      },
    });

    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3005';
    const checkoutUrl = this.wompi.buildCheckoutUrl({
      reference,
      amountInCents,
      currency: plan.currency,
      redirectUrl: `${frontendUrl}/cuenta/plan/confirmar?paymentId=${payment.id}`,
      customerEmail: user.email,
    });

    return { checkoutUrl, paymentId: payment.id };
  }

  // Llamado desde la página de retorno del checkout (Wompi manda ?id=<transactionId> en el
  // redirect). No es la fuente de verdad — solo adelanta la confirmación mientras llega el
  // webhook, que es idempotente con esto (confirmTransaction ignora si ya no está PENDING).
  async syncFromRedirect(userId: string, dto: SyncCheckoutDto) {
    const payment = await this.prisma.payment.findFirst({ where: { id: dto.paymentId, userId } });
    if (!payment) throw new NotFoundException('Pago no encontrado');
    if (payment.status === PaymentStatus.PENDING) {
      const tx = await this.wompi.fetchTransaction(dto.transactionId);
      if (tx) {
        await this.confirmTransaction(tx.reference, tx.id, tx.status);
      }
    }
    return this.prisma.payment.findUnique({ where: { id: payment.id } });
  }

  async handleWebhookEvent(payload: WompiWebhookPayload) {
    if (!this.wompi.verifyWebhookChecksum(payload)) {
      this.logger.warn('Webhook de Wompi con firma inválida — ignorado');
      return { received: false };
    }
    const tx = payload.data?.transaction as Record<string, unknown> | undefined;
    if (tx?.reference && tx?.id && tx?.status) {
      await this.confirmTransaction(String(tx.reference), String(tx.id), String(tx.status));
    }
    return { received: true };
  }

  // Idempotente: si el Payment ya no está PENDING (procesado por el webhook o por el sync
  // del redirect, lo que llegue primero), no hace nada.
  private async confirmTransaction(reference: string, providerTransactionId: string, wompiStatus: string) {
    const payment = await this.prisma.payment.findFirst({ where: { reference } });
    if (!payment || payment.status !== PaymentStatus.PENDING) return;

    if (wompiStatus !== WOMPI_APPROVED) {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.FAILED, providerTransactionId },
      });
      return;
    }

    if (!payment.planId) {
      this.logger.error(`Payment ${payment.id} aprobado por Wompi pero sin planId — no se puede activar suscripción`);
      return;
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.subscription.updateMany({
        where: { userId: payment.userId, status: { in: ACTIVE_SUB_STATUSES } },
        data: { status: SubscriptionStatus.CANCELED, endDate: new Date() },
      });

      const plan = await tx.plan.findUniqueOrThrow({ where: { id: payment.planId! } });
      const startDate = new Date();
      const endDate = new Date(startDate);
      if (plan.billingInterval === BillingInterval.YEARLY) {
        endDate.setFullYear(endDate.getFullYear() + 1);
      } else {
        endDate.setMonth(endDate.getMonth() + 1);
      }

      const subscription = await tx.subscription.create({
        data: { userId: payment.userId, planId: plan.id, status: SubscriptionStatus.ACTIVE, startDate, endDate, autoRenew: true },
      });

      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.COMPLETED,
          providerTransactionId,
          paidAt: new Date(),
          subscriptionId: subscription.id,
        },
      });
    });
  }
}
