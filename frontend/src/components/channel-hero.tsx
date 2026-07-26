'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Hls from 'hls.js';
import { Play, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { gradientFor } from '@/lib/gradient';
import { cn } from '@/lib/utils';
import type { Channel } from '@/lib/api/types';

const AUTOPLAY_MS = 13000;

export function ChannelHero({ channels }: { channels: Channel[] }) {
  const [active, setActive] = useState(0);
  const [muted, setMuted] = useState(true);
  const [videoReady, setVideoReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const channel = channels[active];

  useEffect(() => {
    if (channels.length <= 1) return;
    const id = setInterval(() => setActive((i) => (i + 1) % channels.length), AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [channels.length]);

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
      const hls = new Hls();
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
      className={cn(
        'relative -mt-20 flex h-[85vh] min-h-[440px] w-full items-end overflow-hidden bg-gradient-to-br',
        gradientFor(channel.id),
      )}
    >
      <video
        ref={videoRef}
        muted={muted}
        loop
        playsInline
        className={cn(
          'absolute inset-0 h-full w-full object-cover transition-opacity duration-700',
          videoReady ? 'opacity-100' : 'opacity-0',
        )}
      />

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/10" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/90 via-black/20 to-red-950/20" />

      {videoReady && (
        <button
          type="button"
          onClick={() => setMuted((m) => !m)}
          aria-label={muted ? 'Activar sonido' : 'Silenciar'}
          className="absolute right-4 bottom-6 z-10 flex size-10 items-center justify-center rounded-full border border-white/30 bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60 sm:right-8"
        >
          {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
        </button>
      )}

      <div className="relative w-full px-4 pb-16 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-red-600/60 bg-red-600/10 px-3 py-1 text-xs font-semibold tracking-wide text-red-500 uppercase">
            <span className="size-1.5 rounded-full bg-red-500" />
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
