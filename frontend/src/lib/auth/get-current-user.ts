import 'server-only';
import { serverFetch } from '../api/server';
import { ApiError, type CurrentUser } from '../api/types';
import { getSessionToken } from './session';

// Server-only: usado en layouts/páginas del área de miembro para saber quién es
// el usuario y qué permisos tiene. Devuelve null si no hay sesión o expiró.
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const token = await getSessionToken();
  if (!token) {
    return null;
  }
  try {
    return await serverFetch<CurrentUser>('/auth/me', { withTenant: false });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return null;
    }
    throw error;
  }
}
