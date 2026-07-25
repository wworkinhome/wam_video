import Link from 'next/link';
import { Film } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Movie } from '@/lib/api/types';

export function MovieCard({ movie }: { movie: Movie }) {
  return (
    <Link href={`/peliculas/${movie.slug}`}>
      <Card className="h-full transition-shadow hover:shadow-lg">
        <div className="relative aspect-[2/3] w-full overflow-hidden bg-muted">
          {movie.posterUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={movie.posterUrl} alt={movie.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Film className="size-10 text-muted-foreground" />
            </div>
          )}
          {movie.isPremium && (
            <Badge className="absolute right-2 top-2" variant="default">
              Premium
            </Badge>
          )}
        </div>
        <CardContent className="pt-3">
          <p className="line-clamp-2 text-sm font-medium">{movie.title}</p>
          {movie.releaseYear && <p className="text-xs text-muted-foreground">{movie.releaseYear}</p>}
        </CardContent>
      </Card>
    </Link>
  );
}
