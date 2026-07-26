import Link from 'next/link';
import { serverFetch } from '@/lib/api/server';
import type { Paginated, Channel } from '@/lib/api/types';
import { ChannelCard } from '@/components/channel-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CONTENT_CATEGORIES } from '@/lib/content-categories';
import { countryName, flagUrl } from '@/lib/countries';
import { cn } from '@/lib/utils';

export default async function ChannelsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; category?: string; country?: string }>;
}) {
  const { page, category, country } = await searchParams;
  const currentPage = Number(page ?? '1') || 1;

  const query = new URLSearchParams({ page: String(currentPage), limit: '24' });
  if (category) query.set('category', category);
  if (country) query.set('country', country);

  const result = await serverFetch<Paginated<Channel>>(`/channels?${query.toString()}`);
  const totalPages = Math.max(1, Math.ceil(result.total / result.limit));

  const extraParams = category ? `&category=${encodeURIComponent(category)}` : '';

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-10 sm:px-8">
      <div>
        <h1 className="text-2xl font-bold text-white">TV en Vivo</h1>
        {country && (
          <p className="mt-1 flex items-center gap-1.5 text-sm text-white/60">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={flagUrl(country)} alt="" className="h-3.5 w-5 rounded-sm object-cover ring-1 ring-white/10" />
            {countryName(country)}
            <Link href="/internacional" className="ml-2 text-red-500 hover:text-red-400">
              Cambiar país
            </Link>
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href={`/canales${country ? `?country=${country}` : ''}`}>
          <Badge
            variant={!category ? 'default' : 'secondary'}
            className={cn('cursor-pointer px-3 py-1 text-sm', !category && 'bg-red-600 hover:bg-red-600')}
          >
            Todos
          </Badge>
        </Link>
        {CONTENT_CATEGORIES.map((cat) => (
          <Link key={cat} href={`/canales?category=${encodeURIComponent(cat)}${country ? `&country=${country}` : ''}`}>
            <Badge
              variant={category === cat ? 'default' : 'secondary'}
              className={cn('cursor-pointer px-3 py-1 text-sm', category === cat && 'bg-red-600 hover:bg-red-600')}
            >
              {cat}
            </Badge>
          </Link>
        ))}
      </div>

      {result.data.length === 0 ? (
        <p className="text-white/60">
          {category || country ? 'Todavía no hay canales con estos filtros.' : 'Todavía no hay canales configurados.'}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {result.data.map((channel) => (
            <ChannelCard key={channel.id} channel={channel} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Link
            href={`/canales?page=${Math.max(1, currentPage - 1)}${extraParams}${country ? `&country=${country}` : ''}`}
          >
            <Button variant="outline" size="sm" disabled={currentPage <= 1}>
              Anterior
            </Button>
          </Link>
          <span className="text-sm text-white/60">
            Página {currentPage} de {totalPages}
          </span>
          <Link
            href={`/canales?page=${Math.min(totalPages, currentPage + 1)}${extraParams}${country ? `&country=${country}` : ''}`}
          >
            <Button variant="outline" size="sm" disabled={currentPage >= totalPages}>
              Siguiente
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
