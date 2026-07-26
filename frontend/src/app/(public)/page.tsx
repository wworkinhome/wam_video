import { serverFetch } from '@/lib/api/server';
import type { Paginated, Movie, Series, Channel } from '@/lib/api/types';
import { MovieCard } from '@/components/movie-card';
import { SeriesCard } from '@/components/series-card';
import { ChannelCard } from '@/components/channel-card';
import { ChannelHero } from '@/components/channel-hero';
import { MediaRow } from '@/components/media-row';
import { getActiveProfile } from '@/lib/auth/active-profile';

export default async function LandingPage() {
  const activeProfile = await getActiveProfile();
  const kidsFilter = activeProfile?.isKids ? '&isKids=true' : '';

  const [movies, series, channels, coChannels] = await Promise.all([
    serverFetch<Paginated<Movie>>(`/movies?limit=12${kidsFilter}`),
    serverFetch<Paginated<Series>>(`/series?limit=12${kidsFilter}`),
    serverFetch<Paginated<Channel>>('/channels?limit=12'),
    serverFetch<Paginated<Channel>>('/channels?country=CO&limit=50'),
  ]);

  const isEmpty = movies.data.length === 0 && series.data.length === 0 && channels.data.length === 0;
  const heroChannels = coChannels.data.filter((c) => c.streamUrl).slice(0, 6);

  return (
    <div className="flex flex-col">
      {heroChannels.length > 0 && <ChannelHero channels={heroChannels} />}

      <div className={`mx-auto w-full max-w-7xl px-4 sm:px-8 ${heroChannels.length > 0 ? 'pt-10' : 'pt-28'}`}>
        {isEmpty && <p className="py-16 text-center text-white/60">Todavía no hay contenido publicado.</p>}

        {channels.data.length > 0 && (
          <MediaRow title="TV en Vivo" href="/canales">
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
              <div key={movie.id} className="w-48 shrink-0 sm:w-56 md:w-64">
                <MovieCard movie={movie} />
              </div>
            ))}
          </MediaRow>
        )}

        {series.data.length > 0 && (
          <MediaRow title="Series" href="/series">
            {series.data.map((item) => (
              <div key={item.id} className="w-48 shrink-0 sm:w-56 md:w-64">
                <SeriesCard series={item} />
              </div>
            ))}
          </MediaRow>
        )}
      </div>
    </div>
  );
}
