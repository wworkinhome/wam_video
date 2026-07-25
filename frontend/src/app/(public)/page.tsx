import Link from 'next/link';
import { serverFetch } from '@/lib/api/server';
import type { Paginated, Movie } from '@/lib/api/types';
import { MovieCard } from '@/components/movie-card';
import { Button } from '@/components/ui/button';

export default async function LandingPage() {
  const featured = await serverFetch<Paginated<Movie>>('/movies?limit=12');

  return (
    <div className="flex flex-col gap-12">
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 px-6 py-20 text-center sm:py-28">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_rgba(217,70,239,0.25),_transparent_60%)]" />
        <div className="relative flex flex-col items-center">
          <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Streaming, TV en vivo y eventos{' '}
            <span className="bg-gradient-to-r from-fuchsia-400 to-cyan-300 bg-clip-text text-transparent">
              en un solo lugar
            </span>
          </h1>
          <p className="mt-4 max-w-lg text-balance text-lg text-white/70">
            Películas, series y más — creá tu cuenta y empezá a ver ahora.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/peliculas">
              <Button size="lg" className="bg-white text-slate-900 hover:bg-white/90">
                Explorar catálogo
              </Button>
            </Link>
            <Link href="/registro">
              <Button size="lg" variant="outline" className="border-white/30 bg-white/5 text-white hover:bg-white/10">
                Crear cuenta
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight">Destacados</h2>
          <Link href="/peliculas" className="text-sm text-muted-foreground hover:text-foreground hover:underline">
            Ver todo
          </Link>
        </div>
        {featured.data.length === 0 ? (
          <p className="text-muted-foreground">Todavía no hay películas publicadas.</p>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-3 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-track]:bg-transparent">
            {featured.data.map((movie) => (
              <div key={movie.id} className="w-36 shrink-0 sm:w-44 md:w-48">
                <MovieCard movie={movie} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
