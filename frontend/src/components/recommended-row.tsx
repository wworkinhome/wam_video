'use client';

import { useMovieRecommendations, useSeriesRecommendations } from '@/hooks/use-recommendations';
import { MediaRow } from '@/components/media-row';
import { MovieCard } from '@/components/movie-card';
import { SeriesCard } from '@/components/series-card';

function rowTitle(basedOnGenre: string | null) {
  return basedOnGenre ? `Porque viste ${basedOnGenre}` : 'Recomendado para ti';
}

export function RecommendedMoviesRow({ profileId }: { profileId: string }) {
  const { data } = useMovieRecommendations(profileId);
  if (!data?.items.length) return null;

  return (
    <MediaRow title={rowTitle(data.basedOnGenre)}>
      {data.items.map((movie) => (
        <div key={movie.id} className="w-32 shrink-0 sm:w-40 md:w-48">
          <MovieCard movie={movie} />
        </div>
      ))}
    </MediaRow>
  );
}

export function RecommendedSeriesRow({ profileId }: { profileId: string }) {
  const { data } = useSeriesRecommendations(profileId);
  if (!data?.items.length) return null;

  return (
    <MediaRow title={rowTitle(data.basedOnGenre)}>
      {data.items.map((series) => (
        <div key={series.id} className="w-32 shrink-0 sm:w-40 md:w-48">
          <SeriesCard series={series} />
        </div>
      ))}
    </MediaRow>
  );
}
