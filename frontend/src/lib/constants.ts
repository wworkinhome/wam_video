export const SESSION_COOKIE = 'wam_session';
export const ACTIVE_PROFILE_COOKIE = 'active_profile_id';
export const TENANT_ID_HEADER = 'x-tenant-id';
export const TENANT_SLUG_HEADER = 'x-tenant-slug';

export const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:3000';
export const DEFAULT_TENANT_SLUG = process.env.DEFAULT_TENANT_SLUG ?? 'demo';
