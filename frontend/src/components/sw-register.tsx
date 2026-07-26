'use client';

import { useEffect } from 'react';

// El service worker solo se registra en producción: en dev, cachear
// /_next/static/* rompe Fast Refresh (el navegador sigue usando bundles
// viejos cacheados aunque el servidor ya sirva código nuevo).
export function SwRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    if (process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
      return;
    }

    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((reg) => reg.unregister());
    });
    if ('caches' in window) {
      caches.keys().then((keys) => keys.forEach((key) => caches.delete(key)));
    }
  }, []);

  return null;
}
