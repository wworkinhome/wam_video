'use client';

import Link from 'next/link';
import { Clapperboard, Film } from 'lucide-react';
import { useContinueWatching } from '@/hooks/use-continue-watching';
import { MediaRow } from '@/components/media-row';
import { gradientFor } from '@/lib/gradient';
import { cn } from '@/lib/utils';
import type { WatchHistoryItem } from '@/lib/api/types';

// Fila horizontal "Continuar viendo" con barra de progreso. `kind` filtra a solo
// episodios de series o solo películas (para /series y /peliculas respectivamente —
// la home ya tiene su propia página dedicada a "Continuar viendo" con todo mezclado).
export function ContinueWatchingRow({ profileId, kind }: { profileId: string; kind: 'episode' | 'movie' }) {
  const { data, isLoading } = useContinueWatching(profileId);
  const items = (data?.data ?? []).filter((item) => (kind === 'episode' ? item.episode : item.movie));

  if (isLoading || items.length === 0) return null;

  return (
    <MediaRow title="Continuar viendo">
      {items.map((item) => (
        <div key={item.id} className="w-48 shrink-0 sm:w-56 md:w-64">
          {kind === 'episode' ? <EpisodeCard item={item} /> : <MovieContinueCard item={item} />}
        </div>
      ))}
    </MediaRow>
  );
}

function progressPercent(item: WatchHistoryItem): number {
  return item.durationSeconds ? Math.min(100, Math.round((item.progressSeconds / item.durationSeconds) * 100)) : 0;
}

function EpisodeCard({ item }: { item: WatchHistoryItem }) {
  const episode = item.episode!;
  const series = episode.season?.series;
  const title = series?.title ?? episode.title;

  return (
    <Link href={`/ver/episodio/${episode.id}`} className="group block w-full">
      <div
        className={cn(
          'relative aspect-video w-full overflow-hidden rounded-lg ring-1 ring-white/10 transition-all duration-200 group-hover:scale-105 group-hover:shadow-2xl group-hover:ring-red-600/60',
          !episode.thumbnailUrl && `bg-gradient-to-br ${gradientFor(episode.id)}`,
        )}
      >
        {episode.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={episode.thumbnailUrl} alt={title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Clapperboard className="size-8 text-white/50" />
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent px-2.5 pb-4 pt-6">
          <p className="line-clamp-1 text-xs font-medium text-white">{title}</p>
          <p className="line-clamp-1 text-[11px] text-white/60">{episode.title}</p>
        </div>

        <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20">
          <div className="h-full bg-red-600" style={{ width: `${progressPercent(item)}%` }} />
        </div>
      </div>
    </Link>
  );
}

function MovieContinueCard({ item }: { item: WatchHistoryItem }) {
  const movie = item.movie!;

  return (
    <Link href={`/ver/pelicula/${movie.id}`} className="group block w-full">
      <div
        className={cn(
          'relative aspect-video w-full overflow-hidden rounded-lg ring-1 ring-white/10 transition-all duration-200 group-hover:scale-105 group-hover:shadow-2xl group-hover:ring-red-600/60',
          !movie.backdropUrl && `bg-gradient-to-br ${gradientFor(movie.id)}`,
        )}
      >
        {movie.backdropUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={movie.backdropUrl} alt={movie.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Film className="size-8 text-white/50" />
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent px-2.5 pb-4 pt-6">
          <p className="line-clamp-1 text-xs font-medium text-white">{movie.title}</p>
        </div>

        <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20">
          <div className="h-full bg-red-600" style={{ width: `${progressPercent(item)}%` }} />
        </div>
      </div>
    </Link>
  );
}
