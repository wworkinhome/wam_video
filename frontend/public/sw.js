// Service worker minimo: solo habilita instalabilidad (PWA) y cachea assets
// estaticos. No cachea HTML/API a proposito, para no servir sesiones/datos
// obsoletos (login, catalogo, streams en vivo cambian todo el tiempo).
const STATIC_CACHE = 'wamvideo-static-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== STATIC_CACHE).map((k) => caches.delete(k)))),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const isStaticAsset =
    event.request.method === 'GET' &&
    (url.pathname.startsWith('/_next/static/') ||
      url.pathname.startsWith('/icon-') ||
      url.pathname === '/logo_definitivo_transparent.png');

  if (!isStaticAsset) return;

  event.respondWith(
    caches.open(STATIC_CACHE).then(async (cache) => {
      const cached = await cache.match(event.request);
      if (cached) return cached;
      const response = await fetch(event.request);
      if (response.ok) cache.put(event.request, response.clone());
      return response;
    }),
  );
});
