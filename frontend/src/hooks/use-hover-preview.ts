'use client';

import { useRef, useState } from 'react';
import Hls from 'hls.js';

const HOVER_INTENT_MS = 350;

// Reproduce un video (m3u8) muteado dentro de una tarjeta al pasar el mouse, con un
// pequeño retraso para no cargar streams solo por pasar de largo con el cursor.
// Usado por ChannelCard (canales en vivo) y EpisodeRow (episodios de series).
export function useHoverPreview(videoUrl: string | null | undefined) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [previewing, setPreviewing] = useState(false);

  function stop() {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    hlsRef.current?.destroy();
    hlsRef.current = null;
    const video = videoRef.current;
    if (video) {
      video.pause();
      video.removeAttribute('src');
      video.load();
    }
    setPreviewing(false);
  }

  function start() {
    if (!videoUrl) return;
    hoverTimeoutRef.current = setTimeout(() => {
      const video = videoRef.current;
      if (!video) return;

      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = videoUrl;
        video.play().catch(() => {});
        setPreviewing(true);
      } else if (Hls.isSupported()) {
        const hls = new Hls();
        hlsRef.current = hls;
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(() => {});
          setPreviewing(true);
        });
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) stop();
        });
        hls.loadSource(videoUrl);
        hls.attachMedia(video);
      }
    }, HOVER_INTENT_MS);
  }

  return { videoRef, previewing, start, stop };
}
