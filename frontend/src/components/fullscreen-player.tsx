'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Player } from '@/components/player';
import type { MediaTrack } from '@/lib/api/types';

// Wrapper de pantalla completa para el reproductor de películas/episodios (VOD),
// estilo Netflix — mismo patrón que LiveChannelPlayer pero sin controles custom
// (el <video controls> nativo ya trae scrubber/play/volumen/pantalla completa).
export function FullscreenPlayer({
  title,
  src,
  profileId,
  movieId,
  episodeId,
  mediaTracks,
  initialProgressSeconds,
}: {
  title: string;
  src: string;
  profileId: string;
  movieId?: string;
  episodeId?: string;
  mediaTracks?: MediaTrack[];
  initialProgressSeconds?: number;
}) {
  const router = useRouter();

  return (
    <div className="fixed inset-0 z-100 flex flex-col bg-black">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4 sm:p-6">
        <div className="pointer-events-auto flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Volver"
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
          >
            <ArrowLeft className="size-5" />
          </button>
          <h1 className="truncate text-lg font-bold text-white drop-shadow sm:text-xl">{title}</h1>
        </div>
      </div>

      <Player
        src={src}
        profileId={profileId}
        movieId={movieId}
        episodeId={episodeId}
        mediaTracks={mediaTracks}
        initialProgressSeconds={initialProgressSeconds}
        className="h-full w-full rounded-none object-contain"
      />
    </div>
  );
}
