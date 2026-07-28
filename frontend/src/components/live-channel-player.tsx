'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Maximize, Minimize, ListVideo, Rewind, Volume2, VolumeX, RotateCcw } from 'lucide-react';
import { useHlsPlayer } from '@/hooks/use-hls-player';
import { QualityMenu } from '@/components/quality-menu';
import { cn } from '@/lib/utils';
import type { Channel } from '@/lib/api/types';

const HIDE_CONTROLS_MS = 3000;
const REWIND_STEPS_SECONDS = [15 * 60, 30 * 60, 60 * 60];

function formatOffset(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  if (hours > 0) return `-${hours}h${minutes ? ` ${minutes}m` : ''}`;
  return `-${minutes}m`;
}

export function LiveChannelPlayer({ channel }: { channel: Channel }) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [muted, setMuted] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [rewindSeconds, setRewindSeconds] = useState(0);

  const canRewind = channel.dvrEnabled && !!channel.catchupUrlTemplate;
  const isLive = rewindSeconds === 0;
  const maxRewindSeconds = (channel.catchupWindowHours ?? 0) * 3600;

  const effectiveSrc = useMemo(() => {
    if (isLive || !channel.catchupUrlTemplate) return channel.streamUrl;
    const now = Math.floor(Date.now() / 1000);
    const start = now - rewindSeconds;
    return channel.catchupUrlTemplate
      .replace('{start}', String(start))
      .replace('{now}', String(now))
      .replace('{end}', String(now));
  }, [isLive, rewindSeconds, channel.streamUrl, channel.catchupUrlTemplate]);

  const { levels, currentLevel, setLevel, error, retry, isLoading } = useHlsPlayer(videoRef, effectiveSrc ?? undefined, {
    autoplay: true,
  });

  useEffect(() => {
    function onFullscreenChange() {
      setFullscreen(Boolean(document.fullscreenElement));
    }
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const wakeControls = useCallback(() => {
    setControlsVisible(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setControlsVisible(false), HIDE_CONTROLS_MS);
  }, []);

  useEffect(() => {
    wakeControls();
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [wakeControls]);

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current?.requestFullscreen();
    }
  }

  return (
    <div
      ref={containerRef}
      onMouseMove={wakeControls}
      onTouchStart={wakeControls}
      onClick={wakeControls}
      className={cn('fixed inset-0 z-100 flex flex-col bg-black', !controlsVisible && 'cursor-none')}
    >
      <video ref={videoRef} muted={muted} playsInline className="absolute inset-0 h-full w-full object-cover" />
      <div
        className={cn(
          'pointer-events-none absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/80 transition-opacity duration-500',
          controlsVisible ? 'opacity-100' : 'opacity-0',
        )}
      />

      {isLoading && !error && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3">
          <Loader2 className="size-10 animate-spin text-white/70" />
          <p className="text-sm font-medium text-white/70">Conectando con la señal…</p>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center">
          <p className="text-lg font-medium text-white">No se pudo cargar la señal</p>
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

      <div
        className={cn(
          'relative flex items-start gap-3 p-4 transition-opacity duration-500 sm:p-6',
          controlsVisible ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      >
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Volver"
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
        >
          <ArrowLeft className="size-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-white drop-shadow sm:text-2xl">{channel.name}</h1>
          {channel.category && (
            <span className="mt-1 inline-block rounded bg-red-600/20 px-2 py-0.5 text-xs font-semibold text-red-400">
              {channel.category}
            </span>
          )}
        </div>
      </div>

      <div
        className={cn(
          'relative mt-auto flex flex-col gap-3 p-4 transition-opacity duration-500 sm:p-6',
          controlsVisible ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      >
        {canRewind && (
          <div className="flex flex-wrap items-center gap-2">
            {!isLive && (
              <span className="rounded-full bg-amber-500/20 px-2.5 py-1 text-[11px] font-bold text-amber-300">
                REBOBINADO {formatOffset(rewindSeconds)}
              </span>
            )}
            {REWIND_STEPS_SECONDS.map((step) => (
              <button
                key={step}
                type="button"
                onClick={() =>
                  setRewindSeconds((current) =>
                    Math.min(current + step, maxRewindSeconds > 0 ? maxRewindSeconds : current + step),
                  )
                }
                disabled={maxRewindSeconds > 0 && rewindSeconds >= maxRewindSeconds}
                className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/20 disabled:opacity-40"
              >
                <Rewind className="size-3.5" />
                {formatOffset(step)}
              </button>
            ))}
            {!isLive && (
              <button
                type="button"
                onClick={() => setRewindSeconds(0)}
                className="flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-red-700"
              >
                <span className="size-1.5 rounded-full bg-white" />
                VOLVER A EN VIVO
              </button>
            )}
          </div>
        )}

        <div className="relative h-1 w-full overflow-hidden rounded-full bg-white/20">
          <div className="absolute inset-y-0 left-0 w-full rounded-full bg-red-600" />
          <span className="absolute top-1/2 right-0 flex -translate-y-1/2 items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold whitespace-nowrap text-white">
            <span className="size-1.5 rounded-full bg-white" />
            {isLive ? 'EN VIVO' : formatOffset(rewindSeconds)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setMuted((m) => !m)}
            aria-label={muted ? 'Activar sonido' : 'Silenciar'}
            className="flex size-10 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10"
          >
            {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
          </button>

          <div className="flex items-center gap-2">
            <QualityMenu levels={levels} currentLevel={currentLevel} onSelect={setLevel} />
            <Link
              href="/guia"
              className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-white/85 transition-colors hover:bg-white/10 hover:text-white"
            >
              <ListVideo className="size-4" />
              <span className="hidden sm:inline">Guía de TV</span>
            </Link>
            <button
              type="button"
              onClick={toggleFullscreen}
              aria-label={fullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
              className="flex size-10 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10"
            >
              {fullscreen ? <Minimize className="size-5" /> : <Maximize className="size-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
