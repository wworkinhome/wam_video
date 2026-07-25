import 'server-only';
import { cookies } from 'next/headers';
import { ACTIVE_PROFILE_COOKIE } from '../constants';

// Lectura desde Server Components. Para setear el perfil activo ver
// `active-profile-actions.ts` (requiere un Server Action/Route Handler).
export async function getActiveProfileId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(ACTIVE_PROFILE_COOKIE)?.value ?? null;
}
