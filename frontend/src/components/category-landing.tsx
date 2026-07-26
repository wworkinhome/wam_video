import type { ReactNode } from 'react';
import { serverFetch } from '@/lib/api/server';
import type { Paginated, Movie, Series, Channel } from '@/lib/api/types';
import { ChannelCard } from '@/components/channel-card';
import { PosterCard } from '@/components/poster-card';
import { ChannelHero } from '@/components/channel-hero';
import { MediaRow } from '@/components/media-row';

export async function CategoryLanding({
  category,
  tagline,
  icon,
}: {
  category: string;
  tagline: string;
  icon: ReactNode;
}) {
  // Kids es un flag de control parental (isKids), no un tema — se filtra distinto a
  // Deportes/Noticias/Música, que sí agrupan películas y series por su campo category.
  const isKidsPage = category === 'Kids';
  const categoryQuery = `category=${encodeURIComponent(category)}`;
  const movieSeriesFilter = isKidsPage ? 'isKids=true' : categoryQuery;

  const [channels, movies, series] = await Promise.all([
    serverFetch<Paginated<Channel>>(`/channels?${categoryQuery}&limit=24`),
    serverFetch<Paginated<Movie>>(`/movies?${movieSeriesFilter}&limit=12`),
    serverFetch<Paginated<Series>>(`/series?${movieSeriesFilter}&limit=12`),
  ]);

  const heroChannels = channels.data.filter((c) => c.streamUrl);
  const isEmpty = channels.data.length === 0 && movies.data.length === 0 && series.data.length === 0;

  return (
    <div className="flex flex-col">
      {heroChannels.length > 0 && <ChannelHero channels={heroChannels} />}

      <div className={`mx-auto w-full max-w-7xl px-4 sm:px-8 ${heroChannels.length > 0 ? 'pt-10' : 'pt-28'}`}>
        {heroChannels.length === 0 && (
          <div className="mb-8 flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-full bg-red-600/15 text-red-500">
              {icon}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">{category}</h1>
              <p className="text-sm text-white/60">{tagline}</p>
            </div>
          </div>
        )}

        {isEmpty && <p className="py-16 text-center text-white/60">Todavía no hay contenido publicado.</p>}

        {channels.data.length > 1 && (
          <MediaRow title={`Canales de ${category}`} href={`/canales?category=${encodeURIComponent(category)}`}>
            {channels.data.map((channel) => (
              <div key={channel.id} className="w-48 shrink-0 sm:w-56 md:w-64">
                <ChannelCard channel={channel} />
              </div>
            ))}
          </MediaRow>
        )}

        {movies.data.length > 0 && (
          <MediaRow title="Películas" href="/peliculas">
            {movies.data.map((movie) => (
              <div key={movie.id} className="w-32 shrink-0 sm:w-36 md:w-40">
                <PosterCard
                  id={movie.id}
                  href={`/peliculas/${movie.slug}`}
                  title={movie.title}
                  posterUrl={movie.posterUrl}
                  isPremium={movie.isPremium}
                />
              </div>
            ))}
          </MediaRow>
        )}

        {series.data.length > 0 && (
          <MediaRow title="Series" href="/series">
            {series.data.map((item) => (
              <div key={item.id} className="w-32 shrink-0 sm:w-36 md:w-40">
                <PosterCard
                  id={item.id}
                  href={`/series/${item.slug}`}
                  title={item.title}
                  posterUrl={item.posterUrl}
                  isPremium={item.isPremium}
                />
              </div>
            ))}
          </MediaRow>
        )}
      </div>
    </div>
  );
}
