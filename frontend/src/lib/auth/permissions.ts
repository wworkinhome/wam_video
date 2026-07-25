import type { CurrentUser } from '@/lib/api/types';

export function hasPermission(user: CurrentUser | null, code: string): boolean {
  if (!user) return false;
  if (user.globalPermissions.includes(code)) return true;
  return Object.values(user.tenantPermissions).some((codes) => codes.includes(code));
}
