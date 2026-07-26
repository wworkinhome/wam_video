'use client';

import Link from 'next/link';
import { Film } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { gradientFor } from '@/lib/gradient';
import { useHoverPreview } from '@/hooks/use-hover-preview';
import { cn } from '@/lib/utils';
import type { Movie } from '@/lib/api/types';

export function MovieCard({ movie }: { movie: Movie }) {
  const { videoRef, previewing, start, stop } = useHoverPreview(movie.trailerUrl);

  return (
    <Link href={`/peliculas/${movie.slug}`} className="group block w-full" onMouseEnter={start} onMouseLeave={stop}>
      <div
        className={cn(
          'relative aspect-video w-full overflow-hidden rounded-lg bg-black ring-1 ring-white/10 transition-all duration-200 group-hover:scale-105 group-hover:shadow-2xl group-hover:ring-red-600/60',
          !movie.backdropUrl && !previewing && `bg-gradient-to-br ${gradientFor(movie.id)}`,
        )}
      >
        {movie.backdropUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={movie.backdropUrl}
            alt={movie.title}
            className={cn('h-full w-full object-cover transition-opacity duration-300', previewing && 'opacity-0')}
          />
        ) : (
          <div
            className={cn(
              'flex h-full w-full items-center justify-center transition-opacity duration-300',
              previewing && 'opacity-0',
            )}
          >
            <Film className="size-8 text-white/50" />
          </div>
        )}

        {movie.trailerUrl && (
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

        {movie.isPremium && (
          <Badge className="absolute right-1.5 top-1.5 text-[10px]" variant="default">
            Premium
          </Badge>
        )}

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent px-2.5 pb-1.5 pt-6">
          <p className="line-clamp-1 text-xs font-medium text-white">{movie.title}</p>
        </div>
      </div>
    </Link>
  );
}
