import 'server-only';
import { cookies, headers } from 'next/headers';
import { BACKEND_URL, SESSION_COOKIE, TENANT_ID_HEADER } from '../constants';
import { ApiError } from './types';

interface ServerFetchOptions extends RequestInit {
  /** Adjunta el tenantId resuelto por proxy.ts como query param `tenantId`. Default true. */
  withTenant?: boolean;
}

// Llamado directo servidor-a-servidor al backend NestJS (sin pasar por el proxy
// /api/backend): lee el JWT de la cookie httpOnly y lo reenvía como Bearer.
export async function serverFetch<T>(path: string, options: ServerFetchOptions = {}): Promise<T> {
  const { withTenant = true, ...init } = options;
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  let url = `${BACKEND_URL}${path}`;
  if (withTenant) {
    const headerList = await headers();
    const tenantId = headerList.get(TENANT_ID_HEADER);
    if (tenantId) {
      url += (path.includes('?') ? '&' : '?') + `tenantId=${encodeURIComponent(tenantId)}`;
    }
  }

  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(res.status, body);
  }
  if (res.status === 204) {
    return undefined as T;
  }
  return res.json();
}

export async function getActiveTenantId(): Promise<string | null> {
  const headerList = await headers();
  return headerList.get(TENANT_ID_HEADER);
}
