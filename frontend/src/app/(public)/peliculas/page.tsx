import { serverFetch } from '@/lib/api/server';
import type { Paginated, Movie } from '@/lib/api/types';
import { MovieCard } from '@/components/movie-card';
import { HeroBanner } from '@/components/hero-banner';
import { MediaRow } from '@/components/media-row';
import { ContinueWatchingRow } from '@/components/continue-watching-row';
import { getActiveProfile } from '@/lib/auth/active-profile';

export default async function MoviesPage() {
  const activeProfile = await getActiveProfile();
  const kidsFilter = activeProfile?.isKids ? '&isKids=true' : '';

  const result = await serverFetch<Paginated<Movie>>(`/movies?limit=48${kidsFilter}`);
  const allMovies = result.data;

  if (allMovies.length === 0) {
    return (
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-28 sm:px-8">
        <h1 className="text-2xl font-bold text-white">Películas</h1>
        <p className="text-white/60">Todavía no hay películas publicadas.</p>
      </div>
    );
  }

  const heroMovies = allMovies.filter((m) => m.backdropUrl).slice(0, 5);
  if (heroMovies.length === 0) heroMovies.push(allMovies[0]);

  // Agrupa por género (una película puede aparecer en varias filas si tiene varios géneros).
  const byGenre = new Map<string, Movie[]>();
  for (const movie of allMovies) {
    for (const { genre } of movie.genres ?? []) {
      const list = byGenre.get(genre.name) ?? [];
      list.push(movie);
      byGenre.set(genre.name, list);
    }
  }

  function renderRow(title: string, items: Movie[], href?: string) {
    if (items.length === 0) return null;
    return (
      <MediaRow key={title} title={title} href={href}>
        {items.map((movie) => (
          <div key={movie.id} className="w-48 shrink-0 sm:w-56 md:w-64">
            <MovieCard movie={movie} />
          </div>
        ))}
      </MediaRow>
    );
  }

  return (
    <div className="flex flex-col">
      <HeroBanner movies={heroMovies} activeProfileId={activeProfile?.id} />

      <div className="mx-auto w-full max-w-7xl px-4 pt-10 sm:px-8">
        {activeProfile && <ContinueWatchingRow profileId={activeProfile.id} kind="movie" />}

        {Array.from(byGenre.entries()).map(([genreName, items]) =>
          renderRow(`Películas de ${genreName}`, items),
        )}

        {renderRow('Todas las películas', allMovies, undefined)}
      </div>
    </div>
  );
}
