import Link from 'next/link';
import { Clapperboard } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { gradientFor } from '@/lib/gradient';
import { cn } from '@/lib/utils';
import type { Series } from '@/lib/api/types';

export function SeriesCard({ series }: { series: Series }) {
  return (
    <Link href={`/series/${series.slug}`} className="group block w-full">
      <div
        className={cn(
          'relative aspect-video w-full overflow-hidden rounded-md ring-1 ring-white/10 transition-transform duration-200 group-hover:scale-105 group-hover:shadow-2xl',
          !series.backdropUrl && `bg-gradient-to-br ${gradientFor(series.id)}`,
        )}
      >
        {series.backdropUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={series.backdropUrl} alt={series.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Clapperboard className="size-8 text-white/50" />
          </div>
        )}

        {series.isPremium && (
          <Badge className="absolute right-1.5 top-1.5 text-[10px]" variant="default">
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
