'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Hls from 'hls.js';
import { ArrowLeft, Maximize, Minimize, ListVideo, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Channel } from '@/lib/api/types';

const HIDE_CONTROLS_MS = 3000;

export function LiveChannelPlayer({ channel }: { channel: Channel }) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [muted, setMuted] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [error, setError] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !channel.streamUrl) return;

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = channel.streamUrl;
      video.play().catch(() => {});
    } else if (Hls.isSupported()) {
      const hls = new Hls();
      hlsRef.current = hls;
      hls.loadSource(channel.streamUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(() => {}));
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) setError(true);
      });
    } else {
      setError(true);
    }

    return () => {
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
  }, [channel.streamUrl]);

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

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center">
          <p className="text-lg font-medium text-white">No se pudo cargar la señal</p>
          <p className="text-sm text-white/60">Probá de nuevo más tarde.</p>
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
        <div className="relative h-1 w-full overflow-hidden rounded-full bg-white/20">
          <div className="absolute inset-y-0 left-0 w-full rounded-full bg-red-600" />
          <span className="absolute top-1/2 right-0 flex -translate-y-1/2 items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold whitespace-nowrap text-white">
            <span className="size-1.5 rounded-full bg-white" />
            EN VIVO
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
