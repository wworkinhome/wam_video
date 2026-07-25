export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface TenantBranding {
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  themeConfig: unknown;
}

export interface ResolvedTenant {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  branding: TenantBranding | null;
}

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  status: string;
  tenant: { id: string; name: string; slug: string } | null;
  globalPermissions: string[];
  tenantPermissions: Record<string, string[]>;
}

export interface Genre {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
}

export interface Movie {
  id: string;
  tenantId: string;
  title: string;
  slug: string;
  synopsis: string | null;
  releaseYear: number | null;
  durationMinutes: number | null;
  posterUrl: string | null;
  backdropUrl: string | null;
  trailerUrl: string | null;
  videoUrl: string | null;
  isPremium: boolean;
  status: string;
  genres?: { genre: Genre }[];
}

export interface Episode {
  id: string;
  seasonId: string;
  number: number;
  title: string;
  synopsis: string | null;
  durationMinutes: number | null;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  airDate: string | null;
}

export interface Season {
  id: string;
  seriesId: string;
  number: number;
  title: string | null;
  episodes?: Episode[];
}

export interface Series {
  id: string;
  tenantId: string;
  title: string;
  slug: string;
  synopsis: string | null;
  posterUrl: string | null;
  backdropUrl: string | null;
  isPremium: boolean;
  status: string;
  genres?: { genre: Genre }[];
  seasons?: Season[];
}

export interface MediaTrack {
  id: string;
  type: 'SUBTITLE' | 'AUDIO';
  language: string;
  label: string | null;
  url: string;
  isDefault: boolean;
}

export interface PlaybackInfo {
  id: string;
  title: string;
  videoUrl: string | null;
  durationMinutes: number | null;
  mediaTracks: MediaTrack[];
}

export interface Profile {
  id: string;
  userId: string;
  name: string;
  avatarUrl: string | null;
  isKids: boolean;
  createdAt: string;
  hasPin: boolean;
}

export interface Favorite {
  id: string;
  profileId: string;
  movieId: string | null;
  seriesId: string | null;
  createdAt: string;
  movie?: Movie | null;
  series?: Series | null;
}

export interface WatchHistoryItem {
  id: string;
  profileId: string;
  movieId: string | null;
  episodeId: string | null;
  progressSeconds: number;
  durationSeconds: number | null;
  completed: boolean;
  updatedAt: string;
  movie?: Movie | null;
  episode?: (Episode & { season?: { series?: Series } }) | null;
}

export interface WatchParty {
  id: string;
  hostUserId: string;
  movieId: string | null;
  episodeId: string | null;
  eventId: string | null;
  status: 'SCHEDULED' | 'LIVE' | 'ENDED';
  code: string;
  startedAt: string | null;
  endedAt: string | null;
  participants?: { userId: string; joinedAt: string }[];
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: unknown,
  ) {
    super(`API error ${status}`);
  }
}
