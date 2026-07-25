'use client';

import { useMutation } from '@tanstack/react-query';
import { clientFetch } from '@/lib/api/client';

interface HeartbeatInput {
  profileId: string;
  movieId?: string;
  episodeId?: string;
  progressSeconds: number;
  durationSeconds?: number;
  completed?: boolean;
}

export function usePlaybackHeartbeat() {
  return useMutation({
    mutationFn: (input: HeartbeatInput) =>
      clientFetch('/playback/heartbeat', { method: 'POST', body: JSON.stringify(input) }),
  });
}
