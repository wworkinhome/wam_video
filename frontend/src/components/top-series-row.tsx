import { PosterCard } from './poster-card';
import { MediaRow } from './media-row';
import type { Series } from '@/lib/api/types';

// Fila estilo "Top 10" de Netflix: número gigante superpuesto al póster. El
// ranking sale de actividad real de WatchHistory (ver SeriesService.findPopular
// en el backend) — no hay datos de tendencias por país, así que no se etiqueta
// como "en Colombia hoy", es lo más visto en la plataforma.
export function TopSeriesRow({ series }: { series: Series[] }) {
  if (series.length === 0) return null;

  return (
    <MediaRow title="Las 10 series más populares">
      {series.slice(0, 10).map((item, index) => (
        <div key={item.id} className="flex shrink-0 items-end">
          <span
            aria-hidden
            className="font-display -mr-5 leading-none text-transparent italic select-none [-webkit-text-stroke:3px_var(--color-primary)] text-[5.5rem] sm:-mr-7 sm:text-[7rem]"
          >
            {index + 1}
          </span>
          <div className="w-32 shrink-0 sm:w-40">
            <PosterCard
              id={item.id}
              href={`/series/${item.slug}`}
              title={item.title}
              posterUrl={item.posterUrl}
              isPremium={item.isPremium}
            />
          </div>
        </div>
      ))}
    </MediaRow>
  );
}
