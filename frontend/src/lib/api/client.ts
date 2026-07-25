'use client';

import { ApiError } from './types';

// Usado desde Client Components / hooks de TanStack Query. Llama same-origin al
// proxy /api/backend/[...path], que adjunta el Bearer token server-side — nunca
// se maneja el JWT directamente en este archivo.
export async function clientFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api/backend${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(res.status, body);
  }
  if (res.status === 204) {
    return undefined as T;
  }
  return res.json();
}
