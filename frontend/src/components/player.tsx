'use client';

import { useEffect, useRef } from 'react';
import { RotateCcw } from 'lucide-react';
import { usePlaybackHeartbeat } from '@/hooks/use-playback-heartbeat';
import { useHlsPlayer } from '@/hooks/use-hls-player';
import { QualityMenu } from '@/components/quality-menu';
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
  const { levels, currentLevel, setLevel, error, retry } = useHlsPlayer(videoRef, src, {
    initialProgressSeconds,
  });

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
    <div className={cn('relative overflow-hidden bg-black', className ?? 'aspect-video w-full rounded-lg')}>
      <video ref={videoRef} controls className="h-full w-full object-contain">
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

      <QualityMenu
        levels={levels}
        currentLevel={currentLevel}
        onSelect={setLevel}
        className="absolute top-4 right-4"
      />

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 text-center">
          <p className="text-lg font-medium text-white">No se pudo cargar el video</p>
          <button
            type="button"
            onClick={retry}
            className="flex items-center gap-1.5 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700"
          >
            <RotateCcw className="size-4" />
            Reintentar
          </button>
        </div>
      )}
    </div>
  );
}
