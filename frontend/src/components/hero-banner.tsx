import Link from 'next/link';
import { Play, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { gradientFor } from '@/lib/gradient';
import { cn } from '@/lib/utils';
import type { Movie } from '@/lib/api/types';

export function HeroBanner({ movie }: { movie: Movie }) {
  return (
    <section
      className={cn(
        'relative -mt-20 flex h-[85vh] min-h-[440px] w-full items-end overflow-hidden',
        !movie.backdropUrl && `bg-gradient-to-br ${gradientFor(movie.id)}`,
      )}
    >
      {movie.backdropUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={movie.backdropUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/10" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/85 via-black/10 to-transparent" />

      <div className="relative w-full px-4 pb-16 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <h1 className="max-w-xl text-4xl font-bold text-white drop-shadow-lg sm:text-6xl">{movie.title}</h1>
          {movie.synopsis && (
            <p className="mt-4 line-clamp-3 max-w-md text-sm text-white/85 drop-shadow sm:text-base">
              {movie.synopsis}
            </p>
          )}
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={`/ver/pelicula/${movie.id}`}>
              <Button size="lg" className="gap-2 bg-white text-black hover:bg-white/85">
                <Play className="size-5 fill-black" />
                Reproducir
              </Button>
            </Link>
            <Link href={`/peliculas/${movie.slug}`}>
              <Button size="lg" variant="secondary" className="gap-2 bg-white/20 text-white hover:bg-white/30">
                <Info className="size-5" />
                Más información
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
