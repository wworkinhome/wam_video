import { Search } from 'lucide-react';
import { serverFetch } from '@/lib/api/server';
import type { Paginated, Movie, Series, Channel } from '@/lib/api/types';
import { MovieCard } from '@/components/movie-card';
import { SeriesCard } from '@/components/series-card';
import { ChannelCard } from '@/components/channel-card';
import { MediaRow } from '@/components/media-row';

export const metadata = {
  title: 'Buscar | WAMVIDEO',
};

export default async function BuscarPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? '').trim();

  const [movies, series, channels] = query
    ? await Promise.all([
        serverFetch<Paginated<Movie>>(`/movies?q=${encodeURIComponent(query)}&limit=24`),
        serverFetch<Paginated<Series>>(`/series?q=${encodeURIComponent(query)}&limit=24`),
        serverFetch<Paginated<Channel>>(`/channels?q=${encodeURIComponent(query)}&limit=24`),
      ])
    : [{ data: [], total: 0, page: 1, limit: 24 }, { data: [], total: 0, page: 1, limit: 24 }, { data: [], total: 0, page: 1, limit: 24 }];

  const totalResults = movies.data.length + series.data.length + channels.data.length;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-10 sm:px-8">
      <div className="flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-full bg-red-600/15 text-red-500">
          <Search className="size-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Buscar</h1>
          {query && <p className="text-sm text-white/60">Resultados para &quot;{query}&quot;</p>}
        </div>
      </div>

      {!query ? (
        <p className="text-white/60">Escribí algo para buscar películas, series o canales.</p>
      ) : totalResults === 0 ? (
        <p className="text-white/60">No encontramos resultados para &quot;{query}&quot;.</p>
      ) : (
        <>
          {movies.data.length > 0 && (
            <MediaRow title="Películas">
              {movies.data.map((movie) => (
                <div key={movie.id} className="w-32 shrink-0 sm:w-40 md:w-48">
                  <MovieCard movie={movie} />
                </div>
              ))}
            </MediaRow>
          )}

          {series.data.length > 0 && (
            <MediaRow title="Series">
              {series.data.map((item) => (
                <div key={item.id} className="w-32 shrink-0 sm:w-40 md:w-48">
                  <SeriesCard series={item} />
                </div>
              ))}
            </MediaRow>
          )}

          {channels.data.length > 0 && (
            <MediaRow title="Canales">
              {channels.data.map((channel) => (
                <div key={channel.id} className="w-48 shrink-0 sm:w-56 md:w-64">
                  <ChannelCard channel={channel} />
                </div>
              ))}
            </MediaRow>
          )}
        </>
      )}
    </div>
  );
}
