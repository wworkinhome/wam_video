import Link from 'next/link';
import { serverFetch } from '@/lib/api/server';
import type { Paginated, Channel } from '@/lib/api/types';
import { ChannelCard } from '@/components/channel-card';
import { Button } from '@/components/ui/button';

export default async function ChannelsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const currentPage = Number(page ?? '1') || 1;

  const result = await serverFetch<Paginated<Channel>>(`/channels?page=${currentPage}&limit=24`);
  const totalPages = Math.max(1, Math.ceil(result.total / result.limit));

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-10 sm:px-8">
      <h1 className="text-2xl font-bold text-white">TV en Vivo</h1>

      {result.data.length === 0 ? (
        <p className="text-white/60">Todavía no hay canales configurados.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {result.data.map((channel) => (
            <ChannelCard key={channel.id} channel={channel} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Link href={`/canales?page=${Math.max(1, currentPage - 1)}`}>
            <Button variant="outline" size="sm" disabled={currentPage <= 1}>
              Anterior
            </Button>
          </Link>
          <span className="text-sm text-white/60">
            Página {currentPage} de {totalPages}
          </span>
          <Link href={`/canales?page=${Math.min(totalPages, currentPage + 1)}`}>
            <Button variant="outline" size="sm" disabled={currentPage >= totalPages}>
              Siguiente
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
