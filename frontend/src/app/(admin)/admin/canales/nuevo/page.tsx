import { getCurrentUser } from '@/lib/auth/get-current-user';
import { serverFetch } from '@/lib/api/server';
import type { Paginated, Tenant } from '@/lib/api/types';
import { ChannelForm } from '../channel-form';

export default async function NewChannelPage() {
  const user = await getCurrentUser();
  const tenants = await serverFetch<Paginated<Tenant>>('/tenants?limit=100', { withTenant: false });

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-6 text-2xl font-bold">Nuevo canal</h1>
      <ChannelForm mode="create" tenants={tenants.data} defaultTenantId={user?.tenant?.id ?? null} />
    </div>
  );
}
