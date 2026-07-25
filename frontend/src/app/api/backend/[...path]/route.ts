import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { BACKEND_URL, SESSION_COOKIE } from '@/lib/constants';

// Proxy autenticado genérico para Client Components (TanStack Query). El
// Bearer token SIEMPRE sale de la cookie httpOnly leída aquí server-side —
// cualquier header Authorization/Cookie que mande el cliente se ignora.
async function handler(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  const targetUrl = `${BACKEND_URL}/${path.join('/')}${request.nextUrl.search}`;
  const isBodyless = request.method === 'GET' || request.method === 'HEAD';

  const res = await fetch(targetUrl, {
    method: request.method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: isBodyless ? undefined : await request.text(),
    cache: 'no-store',
  });

  const responseBody = await res.text();
  return new NextResponse(responseBody, {
    status: res.status,
    headers: { 'Content-Type': res.headers.get('Content-Type') ?? 'application/json' },
  });
}

export { handler as GET, handler as POST, handler as PATCH, handler as DELETE };
