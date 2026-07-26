import { notFound } from 'next/navigation';
import { Clapperboard } from 'lucide-react';
import { serverFetch } from '@/lib/api/server';
import type { Paginated, Series } from '@/lib/api/types';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { FavoriteButton } from '@/components/favorite-button';
import { EpisodeRow } from '@/components/episode-row';
import { getActiveProfileId } from '@/lib/auth/active-profile';
import { gradientFor } from '@/lib/gradient';
import { cn } from '@/lib/utils';

export default async function SeriesDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const list = await serverFetch<Paginated<Series>>(`/series?slug=${encodeURIComponent(slug)}&limit=1`);
  const found = list.data[0];
  if (!found) {
    notFound();
  }

  // El listado no incluye temporadas/episodios — se pide el detalle completo por id.
  const series = await serverFetch<Series>(`/series/${found.id}`, { withTenant: false });
  const activeProfileId = await getActiveProfileId();

  return (
    <div className="relative -mt-20">
      {series.backdropUrl && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={series.backdropUrl} alt="" className="absolute inset-0 h-[70vh] w-full object-cover opacity-30" />
          <div className="absolute inset-0 h-[70vh] bg-gradient-to-t from-black via-black/70 to-black/20" />
        </>
      )}
      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 pt-28 pb-10 sm:px-8 md:flex-row">
        <div
          className={cn(
            'aspect-[2/3] w-full max-w-xs shrink-0 overflow-hidden rounded-xl shadow-2xl shadow-black/60 ring-1 ring-white/10',
            !series.posterUrl && `bg-gradient-to-br ${gradientFor(series.id)}`,
          )}
        >
          {series.posterUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={series.posterUrl} alt={series.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Clapperboard className="size-12 text-white/50" />
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-white sm:text-4xl">{series.title}</h1>
            {series.isPremium && <Badge>Premium</Badge>}
          </div>
          {series.synopsis && <p className="max-w-2xl text-sm leading-relaxed text-white/80">{series.synopsis}</p>}
          {activeProfileId && <FavoriteButton profileId={activeProfileId} seriesId={series.id} />}
          {series.genres && series.genres.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {series.genres.map(({ genre }) => (
                <Badge key={genre.id} variant="secondary">
                  {genre.name}
                </Badge>
              ))}
            </div>
          )}

          {(series.seasons ?? []).length > 0 && (
            <div className="mt-2 flex flex-col gap-3">
              <div className="flex items-baseline justify-between gap-3 border-b border-white/10 pb-2">
                <h2 className="text-xl font-bold text-white">Episodios</h2>
                <span className="truncate text-sm text-white/50">{series.title}</span>
              </div>

              <Accordion className="w-full">
                {(series.seasons ?? []).map((season) => (
                  <AccordionItem key={season.id} value={season.id}>
                    <AccordionTrigger className="text-white">
                      {season.title ?? `Temporada ${season.number}`}
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="flex flex-col">
                        {(season.episodes ?? []).map((episode) => (
                          <EpisodeRow key={episode.id} episode={episode} />
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
