import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TenantAccessService } from '../auth/tenant-access.service';
import { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { ListUsersDto } from './dto/list-users.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { AssignPlanDto } from './dto/assign-plan.dto';

const ACTIVE_SUB_STATUSES: SubscriptionStatus[] = [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING];

// Roles de staff/plataforma: administran el catálogo y no consumen contenido bajo un plan.
const STAFF_ROLE_NAMES = ['ROOT', 'SUPER_ADMIN', 'ADMIN_GENERAL', 'ADMIN_TENANT'];

const USER_SELECT = {
  id: true,
  email: true,
  name: true,
  avatarUrl: true,
  status: true,
  tenantId: true,
  emailVerifiedAt: true,
  lastLoginAt: true,
  createdAt: true,
  tenant: { select: { id: true, name: true, slug: true } },
  roles: { select: { role: { select: { name: true } } } },
  subscriptions: {
    where: { status: { in: ACTIVE_SUB_STATUSES } },
    orderBy: { createdAt: 'desc' as const },
    take: 1,
    include: { plan: true },
  },
} satisfies Prisma.UserSelect;

type UserRow = Prisma.UserGetPayload<{ select: typeof USER_SELECT }>;

function toUserSummary(user: UserRow) {
  const { subscriptions, roles, ...rest } = user;
  const subscription = subscriptions[0] ?? null;
  return {
    ...rest,
    isStaff: roles.some((userRole) => STAFF_ROLE_NAMES.includes(userRole.role.name)),
    plan: subscription
      ? {
          subscriptionId: subscription.id,
          planId: subscription.plan.id,
          name: subscription.plan.name,
          price: subscription.plan.price,
          currency: subscription.plan.currency,
          isFree: Number(subscription.plan.price) === 0,
          status: subscription.status,
        }
      : null,
  };
}

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantAccess: TenantAccessService,
  ) {}

  async findAllForAdmin(query: ListUsersDto, actingUser: AuthenticatedUser) {
    if (query.tenantId) {
      this.tenantAccess.assertHasTenantPermission(actingUser, query.tenantId, 'users.view');
    }

    const where: Prisma.UserWhereInput = {
      tenantId: query.tenantId,
      status: query.status,
      OR: query.q
        ? [
            { name: { contains: query.q, mode: 'insensitive' } },
            { email: { contains: query.q, mode: 'insensitive' } },
          ]
        : undefined,
    };

    if (query.plan === 'premium') {
      where.subscriptions = { some: { status: { in: ACTIVE_SUB_STATUSES }, plan: { price: { gt: 0 } } } };
    } else if (query.plan === 'free') {
      // El staff (ROOT/SUPER_ADMIN/etc.) no consume bajo un plan, así que no cuenta como "gratis".
      where.subscriptions = { none: { status: { in: ACTIVE_SUB_STATUSES }, plan: { price: { gt: 0 } } } };
      where.roles = { none: { role: { name: { in: STAFF_ROLE_NAMES } } } };
    }

    const [rows, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: USER_SELECT,
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        relationLoadStrategy: 'join',
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data: rows.map(toUserSummary), total, page: query.page, limit: query.limit };
  }

  async updateStatus(id: string, dto: UpdateUserStatusDto, actingUser: AuthenticatedUser) {
    if (id === actingUser.id) {
      throw new ForbiddenException('No podés cambiar tu propio estado');
    }
    const target = await this.findTargetOrThrow(id);
    this.assertCanManage(target.tenantId, actingUser);

    const updated = await this.prisma.user.update({
      where: { id },
      data: { status: dto.status },
      select: USER_SELECT,
      relationLoadStrategy: 'join',
    });
    return toUserSummary(updated);
  }

  async assignPlan(id: string, dto: AssignPlanDto, actingUser: AuthenticatedUser) {
    const target = await this.findTargetOrThrow(id);
    this.assertCanManage(target.tenantId, actingUser);

    if (dto.planId) {
      await this.prisma.plan.findUniqueOrThrow({ where: { id: dto.planId } });
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.subscription.updateMany({
        where: { userId: id, status: { in: ACTIVE_SUB_STATUSES } },
        data: { status: SubscriptionStatus.CANCELED, endDate: new Date() },
      });
      if (dto.planId) {
        await tx.subscription.create({
          data: { userId: id, planId: dto.planId, status: SubscriptionStatus.ACTIVE, startDate: new Date() },
        });
      }
    });

    const updated = await this.prisma.user.findUniqueOrThrow({
      where: { id },
      select: USER_SELECT,
      relationLoadStrategy: 'join',
    });
    return toUserSummary(updated);
  }

  private async findTargetOrThrow(id: string) {
    const target = await this.prisma.user.findUnique({ where: { id }, select: { id: true, tenantId: true } });
    if (!target) {
      throw new NotFoundException(`User ${id} not found`);
    }
    return target;
  }

  // Usuarios globales (tenantId null, ej. ROOT) solo pueden gestionarse con el permiso global;
  // usuarios de un tenant requieren ese permiso en ese tenant específico (o global).
  private assertCanManage(targetTenantId: string | null, actingUser: AuthenticatedUser): void {
    if (targetTenantId) {
      this.tenantAccess.assertHasTenantPermission(actingUser, targetTenantId, 'users.manage');
      return;
    }
    if (!actingUser.globalPermissions.includes('users.manage')) {
      throw new ForbiddenException('Missing permission "users.manage"');
    }
  }
}
