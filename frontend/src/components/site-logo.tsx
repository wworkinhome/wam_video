import { cn } from '@/lib/utils';

// Logo real (imagen, fondo removido) en vez del wordmark de texto "WAMVIDEO".
// El archivo original mide ~2.5:1 (ancho:alto) — se escala por altura.
export function SiteLogo({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/wamvideo_logo_transparent.png"
      alt="WAMVIDEO"
      className={cn('h-9 w-auto object-contain', className)}
    />
  );
}
