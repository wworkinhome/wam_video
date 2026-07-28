'use client';

import { useQuery } from '@tanstack/react-query';
import { clientFetch } from '@/lib/api/client';
import type { Movie, Series } from '@/lib/api/types';

interface RecommendationsResponse<T> {
  basedOnGenre: string | null;
  items: T[];
}

export function useMovieRecommendations(profileId: string | undefined) {
  return useQuery({
    queryKey: ['recommendations', profileId, 'movie'],
    queryFn: () => clientFetch<RecommendationsResponse<Movie>>(`/profiles/${profileId}/recommendations?type=movie`),
    enabled: !!profileId,
  });
}

export function useSeriesRecommendations(profileId: string | undefined) {
  return useQuery({
    queryKey: ['recommendations', profileId, 'series'],
    queryFn: () => clientFetch<RecommendationsResponse<Series>>(`/profiles/${profileId}/recommendations?type=series`),
    enabled: !!profileId,
  });
}
