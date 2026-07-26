'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Hls from 'hls.js';
import { Play, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SeriesInfoModal } from '@/components/series-info-modal';
import { gradientFor } from '@/lib/gradient';
import { cn } from '@/lib/utils';
import type { Series } from '@/lib/api/types';

const AUTOPLAY_MS = 13000;

export function SeriesHeroBanner({
  seriesList,
  activeProfileId,
}: {
  seriesList: Series[];
  activeProfileId?: string | null;
}) {
  const [active, setActive] = useState(0);
  const [muted, setMuted] = useState(true);
  const [videoReady, setVideoReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const series = seriesList[active];
  const previewUrl = series?.seasons?.[0]?.episodes?.[0]?.videoUrl ?? null;

  useEffect(() => {
    if (seriesList.length <= 1) return;
    const id = setInterval(() => setActive((i) => (i + 1) % seriesList.length), AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [seriesList.length]);

  useEffect(() => {
    setVideoReady(false);
    const video = videoRef.current;
    hlsRef.current?.destroy();
    hlsRef.current = null;
    if (!video || !previewUrl) return;

    const onPlaying = () => setVideoReady(true);
    video.addEventListener('playing', onPlaying);

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = previewUrl;
      video.play().catch(() => {});
    } else if (Hls.isSupported()) {
      const hls = new Hls();
      hlsRef.current = hls;
      hls.loadSource(previewUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(() => {}));
    }

    return () => {
      video.removeEventListener('playing', onPlaying);
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
  }, [series?.id, previewUrl]);

  if (!series) return null;

  const firstEpisodeId = series.seasons?.[0]?.episodes?.[0]?.id;

  return (
    <section
      className={cn(
        'relative -mt-20 flex h-[85vh] min-h-[440px] w-full items-end overflow-hidden',
        !series.backdropUrl && `bg-gradient-to-br ${gradientFor(series.id)}`,
      )}
    >
      {series.backdropUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={series.id}
          src={series.backdropUrl}
          alt=""
          className={cn(
            'absolute inset-0 h-full w-full object-cover transition-opacity duration-700',
            videoReady ? 'opacity-0' : 'animate-in fade-in opacity-100',
          )}
        />
      )}

      {previewUrl && (
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
      )}

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
            Serie destacada
          </span>
          <h1 className="max-w-xl text-4xl font-bold text-white drop-shadow-lg sm:text-6xl">{series.title}</h1>
          {series.synopsis && (
            <p className="mt-4 line-clamp-3 max-w-md text-sm text-white/85 drop-shadow sm:text-base">
              {series.synopsis}
            </p>
          )}
          <div className="mt-6 flex flex-wrap gap-3">
            {firstEpisodeId && (
              <Link href={`/ver/episodio/${firstEpisodeId}`}>
                <Button size="lg" className="gap-2">
                  <Play className="size-5 fill-current" />
                  Reproducir
                </Button>
              </Link>
            )}
            <SeriesInfoModal series={series} activeProfileId={activeProfileId} />
          </div>

          {seriesList.length > 1 && (
            <div className="mt-8 flex gap-2">
              {seriesList.map((s, i) => (
                <button
                  key={s.id}
                  aria-label={`Ir a destacado ${i + 1}`}
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
