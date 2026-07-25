import { BACKEND_URL, DEFAULT_TENANT_SLUG } from './constants';
import type { ResolvedTenant } from './api/types';

// Llamado desde proxy.ts (y solo desde ahí) en cada request para mapear el Host
// de la petición a un tenant. Sin caché todavía — ver docs/FRONTEND.md.
export async function resolveTenantByHost(host: string): Promise<ResolvedTenant | null> {
  const hostname = host.split(':')[0];

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
