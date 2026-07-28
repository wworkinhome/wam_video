import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';

const API_BASE: Record<'sandbox' | 'production', string> = {
  sandbox: 'https://sandbox.wompi.co/v1',
  production: 'https://production.wompi.co/v1',
};

export interface WompiWebhookPayload {
  event: string;
  data: { transaction: Record<string, unknown> };
  signature: { properties: string[]; checksum: string };
  timestamp: number;
}

export interface WompiTransaction {
  id: string;
  status: string;
  reference: string;
  amountInCents: number;
}

// Cliente mínimo de Wompi (pasarela colombiana): construye la URL del Web Checkout
// hospedado por Wompi (nunca vemos datos de tarjeta) y valida/consulta transacciones.
// Docs: https://docs.wompi.co
@Injectable()
export class WompiService {
  private readonly logger = new Logger(WompiService.name);
  private readonly env: 'sandbox' | 'production' = process.env.WOMPI_ENV === 'production' ? 'production' : 'sandbox';
  private readonly publicKey = process.env.WOMPI_PUBLIC_KEY ?? '';
  private readonly privateKey = process.env.WOMPI_PRIVATE_KEY ?? '';
  private readonly integritySecret = process.env.WOMPI_INTEGRITY_SECRET ?? '';
  private readonly eventsSecret = process.env.WOMPI_EVENTS_SECRET ?? '';

  buildIntegritySignature(reference: string, amountInCents: number, currency: string): string {
    const raw = `${reference}${amountInCents}${currency}${this.integritySecret}`;
    return createHash('sha256').update(raw).digest('hex');
  }

  buildCheckoutUrl(params: {
    reference: string;
    amountInCents: number;
    currency: string;
    redirectUrl: string;
    customerEmail?: string;
  }): string {
    const signature = this.buildIntegritySignature(params.reference, params.amountInCents, params.currency);
    const url = new URL('https://checkout.wompi.co/p/');
    url.searchParams.set('public-key', this.publicKey);
    url.searchParams.set('currency', params.currency);
    url.searchParams.set('amount-in-cents', String(params.amountInCents));
    url.searchParams.set('reference', params.reference);
    url.searchParams.set('signature:integrity', signature);
    url.searchParams.set('redirect-url', params.redirectUrl);
    if (params.customerEmail) url.searchParams.set('customer-data:email', params.customerEmail);
    return url.toString();
  }

  // El checksum de eventos cubre las propiedades listadas en signature.properties (resueltas
  // desde `data`, en ese orden) + timestamp + el secreto de eventos del comercio.
  verifyWebhookChecksum(payload: WompiWebhookPayload): boolean {
    if (!payload?.signature?.checksum || !payload.signature.properties) return false;
    const concatenated = payload.signature.properties.map((path) => this.resolvePath(payload.data, path)).join('');
    const raw = `${concatenated}${payload.timestamp}${this.eventsSecret}`;
    const expected = createHash('sha256').update(raw).digest('hex').toUpperCase();
    return expected === payload.signature.checksum.toUpperCase();
  }

  private resolvePath(source: unknown, path: string): string {
    const value = path.split('.').reduce<unknown>((acc, key) => {
      if (acc == null || typeof acc !== 'object') return undefined;
      return (acc as Record<string, unknown>)[key];
    }, source);
    return value == null ? '' : String(value);
  }

  async fetchTransaction(transactionId: string): Promise<WompiTransaction | null> {
    try {
      const res = await fetch(`${API_BASE[this.env]}/transactions/${transactionId}`, {
        headers: { Authorization: `Bearer ${this.privateKey}` },
      });
      if (!res.ok) return null;
      const body = (await res.json()) as { data: Record<string, unknown> };
      const tx = body.data;
      return {
        id: String(tx.id),
        status: String(tx.status),
        reference: String(tx.reference),
        amountInCents: Number(tx.amount_in_cents),
      };
    } catch (error) {
      this.logger.error(`No se pudo consultar la transacción ${transactionId} en Wompi`, error as Error);
      return null;
    }
  }
}
