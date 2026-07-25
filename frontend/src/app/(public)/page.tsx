import Link from 'next/link';
import { serverFetch } from '@/lib/api/server';
import type { Paginated, Movie } from '@/lib/api/types';
import { MovieCard } from '@/components/movie-card';
import { Button } from '@/components/ui/button';

export default async function LandingPage() {
  const featured = await serverFetch<Paginated<Movie>>('/movies?limit=6');

  return (
    <div className="flex flex-col gap-10">
      <section className="rounded-xl bg-muted px-6 py-16 text-center">
        <h1 className="text-3xl font-bold sm:text-4xl">Streaming, TV en vivo y eventos en un solo lugar</h1>
        <p className="mt-3 text-muted-foreground">
          Películas, series y más — creá tu cuenta y empezá a ver ahora.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/peliculas">
            <Button size="lg">Explorar catálogo</Button>
          </Link>
          <Link href="/registro">
            <Button size="lg" variant="outline">
              Crear cuenta
            </Button>
          </Link>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Destacados</h2>
          <Link href="/peliculas" className="text-sm text-muted-foreground hover:underline">
            Ver todo
          </Link>
        </div>
        {featured.data.length === 0 ? (
          <p className="text-muted-foreground">Todavía no hay películas publicadas.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {featured.data.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
