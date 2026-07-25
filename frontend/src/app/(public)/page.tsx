import { serverFetch } from '@/lib/api/server';
import type { Paginated, Movie, Series } from '@/lib/api/types';
import { MovieCard } from '@/components/movie-card';
import { SeriesCard } from '@/components/series-card';
import { HeroBanner } from '@/components/hero-banner';
import { MediaRow } from '@/components/media-row';

export default async function LandingPage() {
  const [movies, series] = await Promise.all([
    serverFetch<Paginated<Movie>>('/movies?limit=12'),
    serverFetch<Paginated<Series>>('/series?limit=12'),
  ]);

  const heroMovie = movies.data[0];
  const isEmpty = movies.data.length === 0 && series.data.length === 0;

  return (
    <div className="flex flex-col">
      {heroMovie && <HeroBanner movie={heroMovie} />}

      <div className="mx-auto w-full max-w-7xl px-4 pt-10 sm:px-8">
        {isEmpty && <p className="py-16 text-center text-white/60">Todavía no hay contenido publicado.</p>}

        {movies.data.length > 0 && (
          <MediaRow title="Películas">
            {movies.data.map((movie) => (
              <div key={movie.id} className="w-48 shrink-0 sm:w-56 md:w-64">
                <MovieCard movie={movie} />
              </div>
            ))}
          </MediaRow>
        )}

        {series.data.length > 0 && (
          <MediaRow title="Series">
            {series.data.map((item) => (
              <div key={item.id} className="w-48 shrink-0 sm:w-56 md:w-64">
                <SeriesCard series={item} />
              </div>
            ))}
          </MediaRow>
        )}
      </div>
    </div>
  );
}
