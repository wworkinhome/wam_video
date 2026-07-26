import { serverFetch } from '@/lib/api/server';
import type { Paginated, Series } from '@/lib/api/types';
import { SeriesCard } from '@/components/series-card';
import { SeriesHeroBanner } from '@/components/series-hero-banner';
import { MediaRow } from '@/components/media-row';
import { ContinueWatchingRow } from '@/components/continue-watching-row';
import { getActiveProfile } from '@/lib/auth/active-profile';

export default async function SeriesListPage() {
  const activeProfile = await getActiveProfile();
  const kidsFilter = activeProfile?.isKids ? '&isKids=true' : '';

  const result = await serverFetch<Paginated<Series>>(`/series?limit=48${kidsFilter}`);
  const allSeries = result.data;

  if (allSeries.length === 0) {
    return (
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-28 sm:px-8">
        <h1 className="text-2xl font-bold text-white">Series</h1>
        <p className="text-white/60">Todavía no hay series publicadas.</p>
      </div>
    );
  }

  const heroSeries = allSeries.filter((s) => s.backdropUrl).slice(0, 5);
  if (heroSeries.length === 0) heroSeries.push(allSeries[0]);

  // Agrupa por género (una serie puede aparecer en varias filas si tiene varios géneros).
  const byGenre = new Map<string, Series[]>();
  for (const series of allSeries) {
    for (const { genre } of series.genres ?? []) {
      const list = byGenre.get(genre.name) ?? [];
      list.push(series);
      byGenre.set(genre.name, list);
    }
  }

  function renderRow(title: string, items: Series[], href?: string) {
    if (items.length === 0) return null;
    return (
      <MediaRow key={title} title={title} href={href}>
        {items.map((series) => (
          <div key={series.id} className="w-48 shrink-0 sm:w-56 md:w-64">
            <SeriesCard series={series} />
          </div>
        ))}
      </MediaRow>
    );
  }

  return (
    <div className="flex flex-col">
      <SeriesHeroBanner seriesList={heroSeries} activeProfileId={activeProfile?.id} />

      <div className="mx-auto w-full max-w-7xl px-4 pt-10 sm:px-8">
        {activeProfile && <ContinueWatchingRow profileId={activeProfile.id} kind="episode" />}

        {Array.from(byGenre.entries()).map(([genreName, items]) =>
          renderRow(`Series de ${genreName}`, items),
        )}

        {renderRow('Todas las series', allSeries, undefined)}
      </div>
    </div>
  );
}
