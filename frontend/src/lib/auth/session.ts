import 'server-only';
import { cookies } from 'next/headers';
import { SESSION_COOKIE } from '../constants';

const isProduction = process.env.NODE_ENV === 'production';

// Solo se puede llamar desde un Route Handler o Server Function (no desde un
// Server Component en render) — así lo exige la API de cookies() de Next.js.
export async function setSessionCookie(accessToken: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24, // 1 día — igual al JWT_EXPIRES_IN por defecto del backend
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSessionToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value;
}
