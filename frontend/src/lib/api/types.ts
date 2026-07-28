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
  category: string | null;
  isPremium: boolean;
  isKids: boolean;
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
  category: string | null;
  isPremium: boolean;
  isKids: boolean;
  status: string;
  genres?: { genre: Genre }[];
  seasons?: Season[];
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  status: string;
}

export interface Channel {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  streamUrl: string | null;
  category: string | null;
  country: string | null;
  isPremium: boolean;
  dvrEnabled: boolean;
  catchupWindowHours: number | null;
  timeshiftEnabled: boolean;
  catchupUrlTemplate: string | null;
  streamStatus: 'ok' | 'broken' | null;
  streamCheckedAt: string | null;
}

export interface EpgProgram {
  id: string;
  channelId: string;
  title: string;
  description: string | null;
  category: string | null;
  startTime: string;
  endTime: string;
}

export interface EpgChannelGuide {
  channel: Channel;
  programs: EpgProgram[];
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

export interface Plan {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  price: string;
  currency: string;
  billingInterval: 'MONTHLY' | 'YEARLY';
  maxProfiles: number;
  maxDevices: number;
  videoQuality: string | null;
  isActive: boolean;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'EXPIRED';
  startDate: string;
  endDate: string | null;
  autoRenew: boolean;
  plan?: Plan;
}

export interface Payment {
  id: string;
  amount: string;
  currency: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  provider: string;
  paidAt: string | null;
  createdAt: string;
  plan?: Plan | null;
}

export interface UserPlanSummary {
  subscriptionId: string;
  planId: string;
  name: string;
  price: string;
  currency: string;
  isFree: boolean;
  status: 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'EXPIRED';
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION' | 'DELETED';
  tenantId: string | null;
  emailVerifiedAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  tenant: { id: string; name: string; slug: string } | null;
  isStaff: boolean;
  plan: UserPlanSummary | null;
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

export interface WatchPartyMessage {
  id: string;
  body: string;
  createdAt: string;
  userId: string;
  userName: string;
}

export interface Notification {
  id: string;
  userId: string;
  channel: 'PUSH' | 'EMAIL' | 'IN_APP';
  type: string;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: unknown,
  ) {
    super(`API error ${status}`);
  }
}
