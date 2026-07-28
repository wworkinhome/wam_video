import type { HlsConfig } from 'hls.js';

// Arranque más rápido en vivo: por default hls.js espera juntar varios
// segmentos de buffer antes de largar a reproducir, lo que en streams IPTV
// públicos (targetDuration alto) se siente como una carga eterna. Acá se
// prioriza arrancar cerca del borde en vivo con el mínimo buffer razonable.
export const FAST_START_HLS_CONFIG: Partial<HlsConfig> = {
  maxBufferLength: 15,
  liveSyncDurationCount: 1,
  backBufferLength: 30,
};
