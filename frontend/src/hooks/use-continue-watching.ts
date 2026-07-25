'use client';

import { useQuery } from '@tanstack/react-query';
import { clientFetch } from '@/lib/api/client';
import type { Paginated, WatchHistoryItem } from '@/lib/api/types';

export function useContinueWatching(profileId: string) {
  return useQuery({
    queryKey: ['continue-watching', profileId],
    queryFn: () =>
      clientFetch<Paginated<WatchHistoryItem>>(`/profiles/${profileId}/continue-watching?limit=20`),
    enabled: Boolean(profileId),
  });
}
