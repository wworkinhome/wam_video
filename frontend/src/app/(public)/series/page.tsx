import Link from 'next/link';
import { serverFetch } from '@/lib/api/server';
import type { Paginated, Series } from '@/lib/api/types';
import { SeriesCard } from '@/components/series-card';
import { Button } from '@/components/ui/button';

export default async function SeriesListPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const currentPage = Number(page ?? '1') || 1;

  const result = await serverFetch<Paginated<Series>>(`/series?page=${currentPage}&limit=24`);
  const totalPages = Math.max(1, Math.ceil(result.total / result.limit));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Series</h1>

      {result.data.length === 0 ? (
        <p className="text-muted-foreground">Todavía no hay series publicadas.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {result.data.map((series) => (
            <SeriesCard key={series.id} series={series} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Link href={`/series?page=${Math.max(1, currentPage - 1)}`}>
            <Button variant="outline" size="sm" disabled={currentPage <= 1}>
              Anterior
            </Button>
          </Link>
          <span className="text-sm text-muted-foreground">
            Página {currentPage} de {totalPages}
          </span>
          <Link href={`/series?page=${Math.min(totalPages, currentPage + 1)}`}>
            <Button variant="outline" size="sm" disabled={currentPage >= totalPages}>
              Siguiente
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
