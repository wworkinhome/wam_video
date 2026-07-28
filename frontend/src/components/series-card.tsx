'use client';

import Link from 'next/link';
import { Clapperboard } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { gradientFor } from '@/lib/gradient';
import { useHoverPreview } from '@/hooks/use-hover-preview';
import { cn } from '@/lib/utils';
import type { Series } from '@/lib/api/types';

export function SeriesCard({ series }: { series: Series }) {
  const previewUrl = series.seasons?.[0]?.episodes?.[0]?.videoUrl ?? null;
  const { videoRef, previewing, start, stop } = useHoverPreview(previewUrl);

  return (
    <Link href={`/series/${series.slug}`} className="group block w-full" onMouseEnter={start} onMouseLeave={stop}>
      <div
        className={cn(
          'card-hover relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-[#0e0b0b] ring-1 ring-white/10 group-hover:ring-red-500/60',
          !series.posterUrl && !previewing && `bg-gradient-to-br ${gradientFor(series.id)}`,
        )}
      >
        {series.posterUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={series.posterUrl}
            alt={series.title}
            className={cn('h-full w-full object-cover transition-opacity duration-300', previewing && 'opacity-0')}
          />
        ) : (
          <div
            className={cn(
              'flex h-full w-full items-center justify-center transition-opacity duration-300',
              previewing && 'opacity-0',
            )}
          >
            <Clapperboard className="size-8 text-white/50" />
          </div>
        )}

        {previewUrl && (
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

        {series.isPremium && (
          <Badge className="absolute right-1.5 top-1.5 bg-accent-glow text-[10px] text-accent-glow-foreground" variant="default">
            Premium
          </Badge>
        )}

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent px-2.5 pb-1.5 pt-6">
          <p className="line-clamp-1 text-xs font-medium text-white">{series.title}</p>
        </div>
      </div>
    </Link>
  );
}
