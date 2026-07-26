import { getCurrentUser } from '@/lib/auth/get-current-user';
import { serverFetch } from '@/lib/api/server';
import type { Paginated, Genre } from '@/lib/api/types';
import { GenresManager } from './genres-manager';

export default async function AdminGenresPage() {
  const user = await getCurrentUser();
  const tenantId = user?.tenant?.id ?? '';
  const genres = await serverFetch<Paginated<Genre>>(`/genres?${tenantId ? `tenantId=${tenantId}&` : ''}limit=100`, {
    withTenant: false,
  });

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Géneros</h1>
        <p className="mt-1 text-sm text-white/60">Usalos para clasificar películas y series en el catálogo.</p>
      </div>
      <GenresManager tenantId={tenantId} genres={genres.data} />
    </div>
  );
}
