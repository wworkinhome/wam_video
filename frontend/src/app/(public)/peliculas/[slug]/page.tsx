import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Film } from 'lucide-react';
import { serverFetch } from '@/lib/api/server';
import type { Paginated, Movie } from '@/lib/api/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FavoriteButton } from '@/components/favorite-button';
import { getActiveProfileId } from '@/lib/auth/active-profile';
import { gradientFor } from '@/lib/gradient';
import { cn } from '@/lib/utils';

export default async function MovieDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await serverFetch<Paginated<Movie>>(`/movies?slug=${encodeURIComponent(slug)}&limit=1`);
  const movie = result.data[0];

  if (!movie) {
    notFound();
  }

  const activeProfileId = await getActiveProfileId();

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 sm:px-8 md:flex-row">
      <div
        className={cn(
          'aspect-[2/3] w-full max-w-xs shrink-0 overflow-hidden rounded-xl',
          !movie.posterUrl && `bg-gradient-to-br ${gradientFor(movie.id)}`,
        )}
      >
        {movie.posterUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={movie.posterUrl} alt={movie.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Film className="size-12 text-white/50" />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-white">{movie.title}</h1>
          {movie.isPremium && <Badge>Premium</Badge>}
        </div>
        {movie.releaseYear && <p className="text-sm text-white/60">{movie.releaseYear}</p>}
        {movie.synopsis && <p className="max-w-2xl text-sm leading-relaxed text-white/80">{movie.synopsis}</p>}
        {movie.genres && movie.genres.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {movie.genres.map(({ genre }) => (
              <Badge key={genre.id} variant="secondary">
                {genre.name}
              </Badge>
            ))}
          </div>
        )}
        <div className="flex gap-3">
          <Link href={`/ver/pelicula/${movie.id}`}>
            <Button size="lg" className="bg-red-600 text-white hover:bg-red-700">
              Ver ahora
            </Button>
          </Link>
          {activeProfileId && <FavoriteButton profileId={activeProfileId} movieId={movie.id} />}
        </div>
      </div>
    </div>
  );
}
