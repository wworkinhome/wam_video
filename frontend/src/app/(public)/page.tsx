import { serverFetch } from '@/lib/api/server';
import type { Paginated, Movie, Series, Channel } from '@/lib/api/types';
import { MovieCard } from '@/components/movie-card';
import { SeriesCard } from '@/components/series-card';
import { ChannelCard } from '@/components/channel-card';
import { ChannelHero } from '@/components/channel-hero';
import { MediaRow } from '@/components/media-row';
import { TopSeriesRow } from '@/components/top-series-row';
import { RecommendedMoviesRow, RecommendedSeriesRow } from '@/components/recommended-row';
import { getActiveProfile } from '@/lib/auth/active-profile';

// Canales colombianos que siempre se destacan primero en "TV en Vivo" —
// Caracol, RCN y Win Sports son los más reconocidos, así que van fijos
// adelante en vez de depender del orden alfabético del catálogo general.
const FEATURED_CHANNEL_SLUGS = ['caracol-tv', 'canal-rcn', 'win-sports'];

// Selección para el hero: variedad de canales colombianos ya verificados
// (streamStatus "ok") + un canal infantil, en vez de los primeros 6 CO al
// azar (algunos de esos pueden estar caídos aunque tengan streamUrl cargado).
const HERO_FEATURED_SLUGS = [
  'caracol-tv',
  'canal-rcn',
  'win-sports',
  'citytv-bogota',
  'senal-colombia',
  'disney-channel-latin-america',
];

// Unión de los dos grupos de arriba, para pedirlos todos en un solo round-trip
// al backend (la DB es remota, así que cada request extra pesa) en vez de una
// consulta por slug.
const ALL_FEATURED_SLUGS = [...new Set([...FEATURED_CHANNEL_SLUGS, ...HERO_FEATURED_SLUGS])];

export default async function LandingPage() {
  const activeProfile = await getActiveProfile();
  const kidsFilter = activeProfile?.isKids ? '&isKids=true' : '';

  const [movies, series, channels, coChannels, popularSeries, allFeatured] = await Promise.all([
    serverFetch<Paginated<Movie>>(`/movies?limit=12${kidsFilter}`),
    serverFetch<Paginated<Series>>(`/series?limit=12${kidsFilter}`),
    serverFetch<Paginated<Channel>>('/channels?limit=12'),
    serverFetch<Paginated<Channel>>('/channels?country=CO&limit=50'),
    serverFetch<Series[]>(`/series/popular?limit=10${kidsFilter}`),
    serverFetch<Paginated<Channel>>(`/channels?slugs=${ALL_FEATURED_SLUGS.join(',')}&limit=${ALL_FEATURED_SLUGS.length}`),
  ]);

  const featuredBySlug = new Map(allFeatured.data.map((c) => [c.slug, c]));
  const pickFeatured = (slugs: string[]) => slugs.map((slug) => featuredBySlug.get(slug)).filter((c): c is Channel => Boolean(c));
  const featuredChannels = pickFeatured(FEATURED_CHANNEL_SLUGS);
  const heroFeaturedChannels = pickFeatured(HERO_FEATURED_SLUGS);

  const isEmpty = movies.data.length === 0 && series.data.length === 0 && channels.data.length === 0;
  const featuredIds = new Set(featuredChannels.map((c) => c.id));
  const tvEnVivoChannels = [...featuredChannels, ...channels.data.filter((c) => !featuredIds.has(c.id))];

  const workingCoChannels = coChannels.data.filter((c) => c.streamStatus === 'ok' && c.streamUrl);
  const heroFeaturedWorking = heroFeaturedChannels.filter((c) => c.streamStatus === 'ok' && c.streamUrl);
  const heroFeaturedIds = new Set(heroFeaturedWorking.map((c) => c.id));
  const heroChannels = [
    ...heroFeaturedWorking,
    ...workingCoChannels.filter((c) => !heroFeaturedIds.has(c.id)),
  ].slice(0, 6);

  return (
    <div className="flex flex-col">
      {heroChannels.length > 0 && <ChannelHero channels={heroChannels} />}

      <div className={`mx-auto w-full max-w-7xl px-4 sm:px-8 ${heroChannels.length > 0 ? 'pt-10' : 'pt-28'}`}>
        {isEmpty && <p className="py-16 text-center text-white/60">Todavía no hay contenido publicado.</p>}

        {tvEnVivoChannels.length > 0 && (
          <MediaRow title="TV en Vivo" href="/canales">
            {tvEnVivoChannels.map((channel) => (
              <div key={channel.id} className="w-48 shrink-0 sm:w-56 md:w-64">
                <ChannelCard channel={channel} />
              </div>
            ))}
          </MediaRow>
        )}

        <TopSeriesRow series={popularSeries} />

        {activeProfile && <RecommendedMoviesRow profileId={activeProfile.id} />}
        {activeProfile && <RecommendedSeriesRow profileId={activeProfile.id} />}

        {movies.data.length > 0 && (
          <MediaRow title="Películas" href="/peliculas">
            {movies.data.map((movie) => (
              <div key={movie.id} className="w-32 shrink-0 sm:w-40 md:w-48">
                <MovieCard movie={movie} />
              </div>
            ))}
          </MediaRow>
        )}

        {series.data.length > 0 && (
          <MediaRow title="Series" href="/series">
            {series.data.map((item) => (
              <div key={item.id} className="w-32 shrink-0 sm:w-40 md:w-48">
                <SeriesCard series={item} />
              </div>
            ))}
          </MediaRow>
        )}
      </div>
    </div>
  );
}
