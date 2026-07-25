import Link from 'next/link';
import { Film } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { gradientFor } from '@/lib/gradient';
import { cn } from '@/lib/utils';
import type { Movie } from '@/lib/api/types';

export function MovieCard({ movie }: { movie: Movie }) {
  return (
    <Link href={`/peliculas/${movie.slug}`} className="group block">
      <Card className="overflow-hidden p-0 transition-transform duration-200 group-hover:-translate-y-1 group-hover:shadow-xl">
        <div
          className={cn(
            'relative aspect-[2/3] w-full overflow-hidden',
            !movie.posterUrl && `bg-gradient-to-br ${gradientFor(movie.id)}`,
          )}
        >
          {movie.posterUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={movie.posterUrl}
              alt={movie.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Film className="size-10 text-white/60" />
            </div>
          )}

          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent px-3 pb-2.5 pt-10">
            <p className="line-clamp-2 text-sm font-medium text-white">{movie.title}</p>
            {movie.releaseYear && <p className="text-xs text-white/70">{movie.releaseYear}</p>}
          </div>

          {movie.isPremium && (
            <Badge className="absolute right-2 top-2 shadow" variant="default">
              Premium
            </Badge>
          )}
        </div>
      </Card>
    </Link>
  );
}
