'use client';

import { useEffect, useRef } from 'react';
import Hls from 'hls.js';
import { usePlaybackHeartbeat } from '@/hooks/use-playback-heartbeat';
import { cn } from '@/lib/utils';
import type { MediaTrack } from '@/lib/api/types';

interface PlayerProps {
  src: string;
  profileId: string;
  movieId?: string;
  episodeId?: string;
  mediaTracks?: MediaTrack[];
  initialProgressSeconds?: number;
  className?: string;
}

const HEARTBEAT_INTERVAL_MS = 15_000;

export function Player({
  src,
  profileId,
  movieId,
  episodeId,
  mediaTracks = [],
  initialProgressSeconds,
  className,
}: PlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const heartbeat = usePlaybackHeartbeat();

  // Carga del stream: HLS nativo en Safari, hls.js en el resto.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hls: Hls | undefined;
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
    } else if (Hls.isSupported()) {
      hls = new Hls();
      hls.loadSource(src);
      hls.attachMedia(video);
    }

    if (initialProgressSeconds) {
      video.currentTime = initialProgressSeconds;
    }

    return () => hls?.destroy();
  }, [src, initialProgressSeconds]);

  // Heartbeat periódico + al pausar, alimentando WatchHistory ("continuar viendo").
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const sendHeartbeat = () => {
      if (video.currentTime === 0) return;
      heartbeat.mutate({
        profileId,
        movieId,
        episodeId,
        progressSeconds: Math.floor(video.currentTime),
        durationSeconds: Number.isFinite(video.duration) ? Math.floor(video.duration) : undefined,
        completed: video.duration > 0 && video.currentTime / video.duration > 0.95,
      });
    };

    const interval = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);
    video.addEventListener('pause', sendHeartbeat);

    return () => {
      clearInterval(interval);
      video.removeEventListener('pause', sendHeartbeat);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId, movieId, episodeId]);

  return (
    <video
      ref={videoRef}
      controls
      className={cn('aspect-video w-full rounded-lg bg-black', className)}
    >
      {mediaTracks
        .filter((track) => track.type === 'SUBTITLE')
        .map((track) => (
          <track
            key={track.id}
            kind="subtitles"
            src={track.url}
            srcLang={track.language}
            label={track.label ?? track.language}
            default={track.isDefault}
          />
        ))}
    </video>
  );
}
