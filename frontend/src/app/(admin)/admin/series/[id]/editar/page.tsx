import { getCurrentUser } from '@/lib/auth/get-current-user';
import { serverFetch } from '@/lib/api/server';
import type { Paginated, Genre, Series } from '@/lib/api/types';
import { SeriesForm } from '../../series-form';
import { SeasonsManager } from '../../seasons-manager';

export default async function EditSeriesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  const [series, genres] = await Promise.all([
    serverFetch<Series>(`/series/admin/${id}`, { withTenant: false }),
    serverFetch<Paginated<Genre>>(`/genres?${user?.tenant ? `tenantId=${user.tenant.id}&` : ''}limit=100`, {
      withTenant: false,
    }),
  ]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-10">
      <div className="max-w-xl">
        <h1 className="mb-6 text-2xl font-bold">Editar serie</h1>
        <SeriesForm mode="edit" series={series} genres={genres.data} />
      </div>

      <SeasonsManager seriesId={series.id} seasons={series.seasons ?? []} />
    </div>
  );
}
