import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { resolveTenantByHost } from './lib/tenant';
import { SESSION_COOKIE, TENANT_ID_HEADER, TENANT_SLUG_HEADER } from './lib/constants';

// Next.js 16 renombró "middleware" a "proxy" (mismo comportamiento, nuevo nombre
// de archivo/función) — ver docs/FRONTEND.md.
const PROTECTED_PREFIXES = ['/perfiles', '/favoritos', '/continuar-viendo', '/ver', '/watch-party'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  if (isProtected && !request.cookies.has(SESSION_COOKIE)) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const host = request.headers.get('host') ?? '';
  const tenant = await resolveTenantByHost(host);

  const requestHeaders = new Headers(request.headers);
  if (tenant) {
    requestHeaders.set(TENANT_ID_HEADER, tenant.id);
    requestHeaders.set(TENANT_SLUG_HEADER, tenant.slug);
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
