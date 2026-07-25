'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { clientFetch } from '@/lib/api/client';
import type { Favorite, Paginated } from '@/lib/api/types';

export function useFavorites(profileId: string) {
  return useQuery({
    queryKey: ['favorites', profileId],
    queryFn: () => clientFetch<Paginated<Favorite>>(`/profiles/${profileId}/favorites?limit=50`),
    enabled: Boolean(profileId),
  });
}

export function useAddFavorite(profileId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { movieId?: string; seriesId?: string }) =>
      clientFetch<Favorite>(`/profiles/${profileId}/favorites`, {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['favorites', profileId] }),
  });
}

export function useRemoveFavorite(profileId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (favoriteId: string) =>
      clientFetch<void>(`/profiles/${profileId}/favorites/${favoriteId}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['favorites', profileId] }),
  });
}
