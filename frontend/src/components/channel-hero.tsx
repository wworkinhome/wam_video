'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Hls from 'hls.js';
import { Loader2, Maximize2, Play, Volume2, VolumeX, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { gradientFor } from '@/lib/gradient';
import { FAST_START_HLS_CONFIG } from '@/lib/hls-config';
import { cn } from '@/lib/utils';
import type { Channel } from '@/lib/api/types';

const AUTOPLAY_MS = 13000;

export function ChannelHero({ channels }: { channels: Channel[] }) {
  const [active, setActive] = useState(0);
  const [muted, setMuted] = useState(true);
  const [videoReady, setVideoReady] = useState(false);
  const [inView, setInView] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const channel = channels[active];
  const miniMode = !inView && videoReady && !dismissed;

  useEffect(() => {
    if (channels.length <= 1) return;
    const id = setInterval(() => setActive((i) => (i + 1) % channels.length), AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [channels.length]);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.12 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setDismissed(false);
  }, [inView, channel?.id]);

  useEffect(() => {
    setVideoReady(false);
    const video = videoRef.current;
    hlsRef.current?.destroy();
    hlsRef.current = null;
    if (!video || !channel?.streamUrl) return;

    const onPlaying = () => setVideoReady(true);
    video.addEventListener('playing', onPlaying);

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = channel.streamUrl;
      video.play().catch(() => {});
    } else if (Hls.isSupported()) {
      const hls = new Hls(FAST_START_HLS_CONFIG);
      hlsRef.current = hls;
      hls.loadSource(channel.streamUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(() => {}));
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) setVideoReady(false);
      });
    }

    return () => {
      video.removeEventListener('playing', onPlaying);
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
  }, [channel?.id, channel?.streamUrl]);

  if (!channel) return null;

  return (
    <section
      ref={sectionRef}
      className={cn(
        'relative -mt-20 flex h-[85vh] min-h-[440px] w-full items-end overflow-hidden bg-gradient-to-br',
        gradientFor(channel.id),
      )}
    >
      <div
        className={cn(
          miniMode
            ? 'fixed right-4 bottom-4 z-40 aspect-video w-64 overflow-hidden rounded-xl shadow-2xl shadow-black/60 ring-2 ring-primary sm:w-80'
            : 'absolute inset-0',
        )}
      >
        <video
          ref={videoRef}
          muted={muted}
          loop
          playsInline
          className={cn(
            'h-full w-full object-cover transition-opacity duration-700',
            videoReady ? 'opacity-100' : 'opacity-0',
            videoReady && !miniMode && 'animate-ken-burns',
          )}
        />

        {miniMode && (
          <>
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/50" />
            <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-2 p-2">
              <span className="flex min-w-0 items-center gap-1.5 text-xs font-semibold text-white">
                <span className="size-1.5 shrink-0 rounded-full bg-red-500" />
                <span className="truncate">{channel.name}</span>
              </span>
              <button
                type="button"
                onClick={() => setDismissed(true)}
                aria-label="Cerrar"
                className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#0e0b0b]/50 text-white transition-colors hover:bg-[#0e0b0b]/70"
              >
                <X className="size-3.5" />
              </button>
            </div>
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 p-2">
              <button
                type="button"
                onClick={() => setMuted((m) => !m)}
                aria-label={muted ? 'Activar sonido' : 'Silenciar'}
                className="flex size-7 items-center justify-center rounded-full bg-[#0e0b0b]/50 text-white transition-colors hover:bg-[#0e0b0b]/70"
              >
                {muted ? <VolumeX className="size-3.5" /> : <Volume2 className="size-3.5" />}
              </button>
              <Link
                href={`/canales/${channel.slug}`}
                aria-label="Ver canal completo"
                className="flex size-7 items-center justify-center rounded-full bg-red-600 text-white transition-colors hover:bg-red-700"
              >
                <Maximize2 className="size-3.5" />
              </Link>
            </div>
          </>
        )}
      </div>

      {!videoReady && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          {channel.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={channel.logoUrl} alt="" className="max-h-20 max-w-[40%] object-contain opacity-90" />
          )}
          {channel.streamUrl && <Loader2 className="size-8 animate-spin text-white/60" />}
        </div>
      )}

      {!miniMode && (
        <>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/10" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/90 via-black/30 to-transparent" />

          {videoReady && (
            <button
              type="button"
              onClick={() => setMuted((m) => !m)}
              aria-label={muted ? 'Activar sonido' : 'Silenciar'}
              className="absolute right-4 bottom-6 z-10 flex size-10 items-center justify-center rounded-full border border-white/30 bg-[#0e0b0b]/40 text-white backdrop-blur-sm transition-colors hover:bg-[#0e0b0b]/60 sm:right-8"
            >
              {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
            </button>
          )}
        </>
      )}

      <div className="relative w-full px-4 pb-16 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white">
            <span className="size-1.5 rounded-full bg-white" />
            En Vivo
          </span>
          <h1 className="max-w-xl text-4xl font-bold text-white drop-shadow-lg sm:text-6xl">{channel.name}</h1>
          <p className="mt-4 max-w-md text-sm text-white/85 drop-shadow sm:text-base">
            WAMVIDEO — 24/7 canales, películas, series y más en vivo.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={`/canales/${channel.slug}`}>
              <Button size="lg" className="gap-2">
                <Play className="size-5 fill-current" />
                Ver en vivo
              </Button>
            </Link>
          </div>

          {channels.length > 1 && (
            <div className="mt-8 flex gap-2">
              {channels.map((c, i) => (
                <button
                  key={c.id}
                  aria-label={`Ir a canal ${i + 1}`}
                  onClick={() => setActive(i)}
                  className={cn(
                    'h-1.5 rounded-full transition-all',
                    i === active ? 'w-6 bg-red-600' : 'w-1.5 bg-white/30 hover:bg-white/50',
                  )}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
