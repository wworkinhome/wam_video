import { getCurrentUser } from '@/lib/auth/get-current-user';
import { serverFetch } from '@/lib/api/server';
import type { Paginated, Tenant, Genre } from '@/lib/api/types';
import { MovieForm } from '../movie-form';

export default async function NewMoviePage() {
  const user = await getCurrentUser();
  const [tenants, genres] = await Promise.all([
    serverFetch<Paginated<Tenant>>('/tenants?limit=100', { withTenant: false }),
    serverFetch<Paginated<Genre>>(`/genres?${user?.tenant ? `tenantId=${user.tenant.id}&` : ''}limit=100`, {
      withTenant: false,
    }),
  ]);

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-6 text-2xl font-bold">Nueva película</h1>
      <MovieForm mode="create" tenants={tenants.data} defaultTenantId={user?.tenant?.id ?? null} genres={genres.data} />
    </div>
  );
}
