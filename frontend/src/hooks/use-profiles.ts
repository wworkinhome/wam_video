'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { clientFetch } from '@/lib/api/client';
import type { Profile } from '@/lib/api/types';

export function useProfiles() {
  return useQuery({
    queryKey: ['profiles'],
    queryFn: () => clientFetch<Profile[]>('/profiles'),
  });
}

export function useCreateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; isKids?: boolean }) =>
      clientFetch<Profile>('/profiles', { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profiles'] }),
  });
}

export function useDeleteProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => clientFetch<void>(`/profiles/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profiles'] }),
  });
}
