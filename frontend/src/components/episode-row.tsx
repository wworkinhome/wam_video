'use client';

import Link from 'next/link';
import { Play } from 'lucide-react';
import { useHoverPreview } from '@/hooks/use-hover-preview';
import { cn } from '@/lib/utils';
import type { Episode } from '@/lib/api/types';

export function EpisodeRow({ episode }: { episode: Episode }) {
  const { videoRef, previewing, start, stop } = useHoverPreview(episode.videoUrl);

  return (
    <Link
      href={`/ver/episodio/${episode.id}`}
      className="group -mx-2 flex items-start gap-3 border-b border-white/10 px-2 py-4 transition-colors last:border-b-0 hover:bg-white/5 sm:gap-5"
      onMouseEnter={start}
      onMouseLeave={stop}
    >
      <span className="w-5 shrink-0 pt-1 text-center text-xl font-medium text-white/40 sm:w-8 sm:text-2xl">
        {episode.number}
      </span>

      <div className="relative aspect-video w-28 shrink-0 overflow-hidden rounded-md bg-white/10 sm:w-44">
        {episode.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={episode.thumbnailUrl}
            alt={episode.title}
            className={cn('h-full w-full object-cover transition-opacity duration-300', previewing && 'opacity-0')}
          />
        ) : (
          <div
            className={cn(
              'flex h-full w-full items-center justify-center text-2xl font-black text-white/20 transition-opacity duration-300',
              previewing && 'opacity-0',
            )}
          >
            {episode.number}
          </div>
        )}

        {episode.videoUrl && (
          <video
            ref={videoRef}
            muted
            playsInline
            className={cn(
              'absolute inset-0 h-full w-full object-cover transition-opacity duration-300',
              previewing ? 'opacity-100' : 'pointer-events-none opacity-0',
            )}
          />
        )}

        <div
          className={cn(
            'pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity duration-200',
            previewing ? 'opacity-0' : 'opacity-100 group-hover:bg-black/40',
          )}
        >
          <span className="flex size-8 items-center justify-center rounded-full bg-white/85 text-black opacity-80 transition-all duration-200 group-hover:scale-110 group-hover:opacity-100">
            <Play className="size-4 fill-current" />
          </span>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1 pt-0.5">
        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate text-sm font-semibold text-white sm:text-base">{episode.title}</p>
          {episode.durationMinutes && (
            <span className="shrink-0 text-xs text-white/50 sm:text-sm">{episode.durationMinutes} min</span>
          )}
        </div>
        {episode.synopsis && (
          <p className="line-clamp-2 text-xs text-white/60 sm:line-clamp-3 sm:text-sm">{episode.synopsis}</p>
        )}
        {!episode.videoUrl && <span className="text-xs text-amber-400">Sin video disponible</span>}
      </div>
    </Link>
  );
}
