'use client';

import { useQuery } from '@tanstack/react-query';
import { clientFetch } from '@/lib/api/client';
import type { Notification } from '@/lib/api/types';

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: () => clientFetch<{ data: Notification[]; total: number }>('/notifications?limit=20&offset=0'),
  });
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: () => clientFetch<{ unread: number }>('/notifications/unread-count'),
  });
}