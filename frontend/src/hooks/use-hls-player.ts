'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { FAST_START_HLS_CONFIG } from '@/lib/hls-config';

export interface HlsLevel {
  index: number;
  height: number;
  bitrate: number;
}

interface UseHlsPlayerOptions {
  autoplay?: boolean;
  initialProgressSeconds?: number;
  maxRetries?: number;
}

// Adjunta hls.js (o HLS nativo en Safari) a un <video>, con selector de calidad manual
// y recuperación automática de errores de red/medio (con backoff acotado) antes de
// rendirse y dejar que la UI muestre un botón de "Reintentar".
export function useHlsPlayer(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  src: string | undefined,
  { autoplay = false, initialProgressSeconds, maxRetries = 3 }: UseHlsPlayerOptions = {},
) {
  const hlsRef = useRef<Hls | null>(null);
  const retriesRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [levels, setLevels] = useState<HlsLevel[]>([]);
  const [currentLevel, setCurrentLevel] = useState(-1);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    retriesRef.current = 0;
    setError(false);
    setLevels([]);
    setCurrentLevel(-1);
    setIsLoading(true);

    function applyInitialProgress() {
      if (initialProgressSeconds && video) video.currentTime = initialProgressSeconds;
    }
    function onPlaying() {
      setIsLoading(false);
    }
    video.addEventListener('loadedmetadata', applyInitialProgress);
    video.addEventListener('playing', onPlaying);

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      if (autoplay) video.play().catch(() => {});
      return () => {
        video.removeEventListener('loadedmetadata', applyInitialProgress);
        video.removeEventListener('playing', onPlaying);
        video.removeAttribute('src');
        video.load();
      };
    }

    if (!Hls.isSupported()) {
      setError(true);
      return () => {
        video.removeEventListener('loadedmetadata', applyInitialProgress);
        video.removeEventListener('playing', onPlaying);
      };
    }

    const hls = new Hls({ ...FAST_START_HLS_CONFIG, capLevelToPlayerSize: true });
    hlsRef.current = hls;
    hls.loadSource(src);
    hls.attachMedia(video);

    function attemptRecovery() {
      if (retriesRef.current >= maxRetries) {
        setError(true);
        setIsLoading(false);
        return;
      }
      const delay = 1000 * 2 ** retriesRef.current;
      retriesRef.current += 1;
      retryTimerRef.current = setTimeout(() => hls.startLoad(), delay);
    }

    hls.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
      setLevels(data.levels.map((level, index) => ({ index, height: level.height, bitrate: level.bitrate })));
      if (autoplay) video.play().catch(() => {});
    });

    hls.on(Hls.Events.LEVEL_SWITCHED, (_event, data) => {
      setCurrentLevel(hls.autoLevelEnabled ? -1 : data.level);
    });

    hls.on(Hls.Events.ERROR, (_event, data) => {
      if (!data.fatal) return;
      if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
        attemptRecovery();
      } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
        hls.recoverMediaError();
      } else {
        setError(true);
        setIsLoading(false);
      }
    });

    return () => {
      video.removeEventListener('loadedmetadata', applyInitialProgress);
      video.removeEventListener('playing', onPlaying);
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      hls.destroy();
      hlsRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, autoplay, maxRetries, reloadKey]);

  const setLevel = useCallback((index: number) => {
    const hls = hlsRef.current;
    if (!hls) return;
    hls.currentLevel = index;
    setCurrentLevel(index);
  }, []);

  const retry = useCallback(() => {
    retriesRef.current = 0;
    setError(false);
    setReloadKey((key) => key + 1);
  }, []);

  return { levels, currentLevel, setLevel, error, retry, isLoading };
}
