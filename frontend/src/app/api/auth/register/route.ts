import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL } from '@/lib/constants';
import { setSessionCookie } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const res = await fetch(`${BACKEND_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    return NextResponse.json(data, { status: res.status });
  }

  await setSessionCookie(data.accessToken);
  return NextResponse.json({ ok: true });
}
