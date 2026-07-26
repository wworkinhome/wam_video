import { getCurrentUser } from '@/lib/auth/get-current-user';
import { serverFetch } from '@/lib/api/server';
import type { Paginated, AdminUser, Plan } from '@/lib/api/types';
import { UsersManager } from './users-manager';

export default async function AdminUsersPage() {
  const user = await getCurrentUser();
  const tenantQuery = user?.tenant ? `tenantId=${user.tenant.id}&` : '';

  const [users, plans] = await Promise.all([
    serverFetch<Paginated<AdminUser>>(`/users?${tenantQuery}limit=100`, { withTenant: false }),
    serverFetch<Plan[]>(`/plans?${tenantQuery}`, { withTenant: false }).catch(() => []),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Usuarios</h1>
        <p className="mt-1 text-sm text-white/60">Gestioná cuentas, estados y quién tiene plan gratuito o premium.</p>
      </div>
      <UsersManager initialUsers={users.data} plans={plans} currentUserId={user?.id ?? ''} />
    </div>
  );
}
