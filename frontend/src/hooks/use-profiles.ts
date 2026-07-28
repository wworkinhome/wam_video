'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { clientFetch } from '@/lib/api/client';
import type { Profile } from '@/lib/api/types';

export interface ProfileInput {
  name: string;
  avatarUrl?: string;
  isKids?: boolean;
  pinCode?: string;
}

export function useProfiles(enabled = true) {
  return useQuery({
    queryKey: ['profiles'],
    queryFn: () => clientFetch<Profile[]>('/profiles'),
    enabled,
  });
}

export function useCreateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ProfileInput) => clientFetch<Profile>('/profiles', { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profiles'] }),
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: ProfileInput & { id: string }) =>
      clientFetch<Profile>(`/profiles/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
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

export function useVerifyProfilePin() {
  return useMutation({
    mutationFn: ({ id, pin }: { id: string; pin: string }) =>
      clientFetch<{ valid: boolean }>(`/profiles/${id}/verify-pin`, { method: 'POST', body: JSON.stringify({ pin }) }),
  });
}
