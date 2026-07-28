import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SESSION_COOKIE } from '@/lib/constants';

// El chat en vivo del watch party conecta el navegador DIRECTO al gateway WebSocket del
// backend (Next no puede proxyear una conexión persistente vía route handlers), así que
// necesita el JWT en JS de cliente para el handshake — este endpoint es la única salida
// controlada para eso, y solo reenvía la misma cookie httpOnly que ya usa el resto del BFF.
export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }
  return NextResponse.json({ token });
}
