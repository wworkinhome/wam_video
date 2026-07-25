'use server';

import { cookies } from 'next/headers';
import { ACTIVE_PROFILE_COOKIE } from '../constants';

// Cookie no-httpOnly a propósito: solo guarda un UUID de perfil, no un secreto —
// no necesita protección contra lectura por JS de cliente.
export async function selectActiveProfile(profileId: string) {
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_PROFILE_COOKIE, profileId, {
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
    sameSite: 'lax',
  });
}
