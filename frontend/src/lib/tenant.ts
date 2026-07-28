import { BACKEND_URL, DEFAULT_TENANT_SLUG } from './constants';
import type { ResolvedTenant } from './api/types';

// Llamado desde proxy.ts (y solo desde ahí) en CADA request — página, asset dinámico,
// y toda llamada a /api/backend/* o /api/auth/* — para mapear el Host a un tenant.
// Proxy corre en runtime de Node.js (no Edge aislado), así que este cache en memoria
// del proceso persiste entre requests: evita pegarle al backend en cada click/carga.
// Antes esto no tenía cache y agregaba ~1-2s a TODO, incluidas las acciones de botones.
const TTL_MS = 30 * 60_000;
const cache = new Map<string, { tenant: ResolvedTenant | null; expiresAt: number }>();

export async function resolveTenantByHost(host: string): Promise<ResolvedTenant | null> {
  const hostname = host.split(':')[0];

  const cached = cache.get(hostname);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.tenant;
  }

  const tenant = await resolveFresh(hostname);
  cache.set(hostname, { tenant, expiresAt: Date.now() + TTL_MS });
  return tenant;
}

async function resolveFresh(hostname: string): Promise<ResolvedTenant | null> {
  const byDomain = await fetchResolve(`domain=${encodeURIComponent(hostname)}`);
  if (byDomain) return byDomain;

  // Fallback para desarrollo local (localhost no tiene un Tenant.domain real).
  if (DEFAULT_TENANT_SLUG) {
    return fetchResolve(`slug=${encodeURIComponent(DEFAULT_TENANT_SLUG)}`);
  }
  return null;
}

async function fetchResolve(query: string): Promise<ResolvedTenant | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/tenants/resolve?${query}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return (await res.json()) as ResolvedTenant;
  } catch {
    return null;
  }
}
