'use client';

import { useEffect, useRef } from 'react';
import Hls from 'hls.js';

// A diferencia de <Player>, no manda heartbeats: la TV en vivo no tiene concepto
// de "continuar viendo" (WatchHistory está atado a movieId/episodeId, no a un canal).
export function LivePlayer({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);

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

    return () => hls?.destroy();
  }, [src]);

  return <video ref={videoRef} controls autoPlay className="aspect-video w-full rounded-lg bg-black" />;
}
