import Link from 'next/link';
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
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 sm:px-8 md:flex-row">
      <div
        className={cn(
          'aspect-[2/3] w-full max-w-xs shrink-0 overflow-hidden rounded-xl',
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
          <h1 className="text-2xl font-bold text-white">{series.title}</h1>
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

        <Accordion className="w-full">
          {(series.seasons ?? []).map((season) => (
            <AccordionItem key={season.id} value={season.id}>
              <AccordionTrigger className="text-white">
                {season.title ?? `Temporada ${season.number}`}
              </AccordionTrigger>
              <AccordionContent>
                <ul className="flex flex-col gap-2">
                  {(season.episodes ?? []).map((episode) => (
                    <li key={episode.id}>
                      <Link
                        href={`/ver/episodio/${episode.id}`}
                        className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm text-white/80 hover:bg-white/10 hover:text-white"
                      >
                        <span>
                          {episode.number}. {episode.title}
                        </span>
                        {episode.durationMinutes && (
                          <span className="text-xs text-white/50">{episode.durationMinutes} min</span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}
