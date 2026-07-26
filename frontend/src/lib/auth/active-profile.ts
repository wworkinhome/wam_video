import 'server-only';
import { cookies } from 'next/headers';
import { ACTIVE_PROFILE_COOKIE } from '../constants';
import { serverFetch } from '../api/server';
import { ApiError, type Profile } from '../api/types';

// Lectura desde Server Components. Para setear el perfil activo ver
// `active-profile-actions.ts` (requiere un Server Action/Route Handler).
export async function getActiveProfileId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(ACTIVE_PROFILE_COOKIE)?.value ?? null;
}

// Perfil activo completo (incluye isKids) para filtrar el catálogo según
// control parental. Devuelve null si no hay perfil activo o ya no existe.
export async function getActiveProfile(): Promise<Profile | null> {
  const profileId = await getActiveProfileId();
  if (!profileId) return null;
  try {
    return await serverFetch<Profile>(`/profiles/${profileId}`, { withTenant: false });
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 401)) {
      return null;
    }
    throw error;
  }
}
