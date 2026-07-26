'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, Play, Info, Clapperboard } from 'lucide-react';
import { Dialog, DialogTrigger, DialogContent, DialogPortal, DialogOverlay } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { EpisodeRow } from '@/components/episode-row';
import { SeriesCard } from '@/components/series-card';
import { FavoriteButton } from '@/components/favorite-button';
import { clientFetch } from '@/lib/api/client';
import { gradientFor } from '@/lib/gradient';
import { cn } from '@/lib/utils';
import type { Paginated, Series } from '@/lib/api/types';

// Modal estilo "más información" de Netflix: se abre sobre la página actual (sin
// navegar), trae el detalle completo (temporadas/episodios) y títulos similares
// recién al abrirse.
export function SeriesInfoModal({ series, activeProfileId }: { series: Series; activeProfileId?: string | null }) {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<Series | null>(null);
  const [similar, setSimilar] = useState<Series[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next && !detail) {
      setLoading(true);
      try {
        const [full, list] = await Promise.all([
          clientFetch<Series>(`/series/${series.id}`),
          clientFetch<Paginated<Series>>(`/series?limit=13`),
        ]);
        setDetail(full);
        setSimilar(rankSimilar(list.data, full));
      } catch {
        setDetail(series);
      } finally {
        setLoading(false);
      }
    }
  }

  // Salvavidas: si el modal se desmonta (ej. navegando con un Link de adentro, como
  // "Ver página completa" o una tarjeta de "similares") sin pasar por el cierre normal
  // del Dialog, el scroll-lock del body puede quedar pegado. Se limpia siempre al salir.
  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.removeProperty('scrollbar-gutter');
    };
  }, []);

  const shown = detail ?? series;
  const firstEpisodeId = shown.seasons?.[0]?.episodes?.[0]?.id;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button size="lg" variant="secondary" className="gap-2 bg-white/15 text-white hover:bg-white/25" />}>
        <Info className="size-5" />
        Más información
      </DialogTrigger>

      <DialogPortal>
        <DialogOverlay className="bg-black/70" />
        <DialogContent
          showCloseButton
          className="max-w-2xl gap-0 overflow-hidden rounded-xl border-none bg-[#141414] p-0 sm:max-w-3xl"
        >
          <div
            className={cn(
              'relative aspect-video w-full',
              !shown.backdropUrl && `bg-gradient-to-br ${gradientFor(shown.id)}`,
            )}
          >
            {shown.backdropUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={shown.backdropUrl} alt="" className="h-full w-full object-cover" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/20 to-transparent" />

            <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 p-5 sm:p-6">
              <h2 className="text-2xl font-bold text-white drop-shadow-lg sm:text-3xl">{shown.title}</h2>
              <div className="flex flex-wrap gap-3">
                {firstEpisodeId && (
                  <Link href={`/ver/episodio/${firstEpisodeId}`}>
                    <Button className="gap-2">
                      <Play className="size-4 fill-current" />
                      Reproducir
                    </Button>
                  </Link>
                )}
                {activeProfileId && <FavoriteButton profileId={activeProfileId} seriesId={shown.id} />}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              {shown.isPremium && <Badge>Premium</Badge>}
              {shown.genres?.map(({ genre }) => (
                <Badge key={genre.id} variant="secondary">
                  {genre.name}
                </Badge>
              ))}
            </div>

            {shown.synopsis && <p className="text-sm leading-relaxed text-white/80">{shown.synopsis}</p>}

            <Link
              href={`/series/${shown.slug}`}
              className="w-fit text-sm text-white/50 underline underline-offset-2 hover:text-white"
            >
              Ver página completa
            </Link>

            <div className="mt-1 flex flex-col gap-3 border-t border-white/10 pt-4">
              <h3 className="text-lg font-bold text-white">Episodios</h3>

              {loading ? (
                <div className="flex items-center gap-2 py-8 text-white/50">
                  <Loader2 className="size-5 animate-spin" />
                  Cargando episodios…
                </div>
              ) : (shown.seasons ?? []).length === 0 ? (
                <p className="flex items-center gap-2 py-4 text-sm text-white/50">
                  <Clapperboard className="size-4" />
                  Todavía no hay episodios cargados.
                </p>
              ) : (
                <Accordion className="w-full">
                  {(shown.seasons ?? []).map((season) => (
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
              )}
            </div>

            <div className="mt-1 flex flex-col gap-3 border-t border-white/10 pt-4">
              <h3 className="text-lg font-bold text-white">Más títulos similares</h3>

              {loading ? (
                <div className="flex items-center gap-2 py-4 text-white/50">
                  <Loader2 className="size-5 animate-spin" />
                  Cargando…
                </div>
              ) : !similar || similar.length === 0 ? (
                <p className="py-2 text-sm text-white/50">No encontramos títulos parecidos todavía.</p>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {similar.map((item) => (
                    <SeriesCard key={item.id} series={item} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}

// Prioriza los que comparten género con el actual; si no hay géneros cargados
// todavía, cae de vuelta al resto del catálogo (excluyendo el título actual).
function rankSimilar(all: Series[], current: Series): Series[] {
  const currentGenreIds = new Set((current.genres ?? []).map((g) => g.genre.id));
  return all
    .filter((item) => item.id !== current.id)
    .map((item) => {
      const shared = (item.genres ?? []).filter((g) => currentGenreIds.has(g.genre.id)).length;
      return { item, shared };
    })
    .sort((a, b) => b.shared - a.shared)
    .slice(0, 10)
    .map(({ item }) => item);
}
