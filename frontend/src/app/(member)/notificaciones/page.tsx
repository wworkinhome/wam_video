'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Bell, Check, Trash2 } from 'lucide-react';
import { useNotifications } from '@/hooks/use-notifications';
import { clientFetch } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Notification } from '@/lib/api/types';

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Ahora';
  if (diffMin < 60) return `${diffMin}m`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h`;
  return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
}

export default function NotificationsPage() {
  const { data, isLoading, refetch } = useNotifications();
  const [markingAllRead, setMarkingAllRead] = useState(false);

  async function handleMarkAllRead() {
    setMarkingAllRead(true);
    try {
      await clientFetch('/notifications/mark-all-read', { method: 'POST', body: JSON.stringify({}) });
      await refetch();
    } catch {
    } finally {
      setMarkingAllRead(false);
    }
  }

  async function handleMarkRead(id: string) {
    try {
      await clientFetch(`/notifications/${id}/read`, { method: 'PATCH', body: JSON.stringify({}) });
      await refetch();
    } catch {
    }
  }

  async function handleDelete(id: string) {
    try {
      await clientFetch(`/notifications/${id}`, { method: 'DELETE' });
      await refetch();
    } catch {
    }
  }

  const notifications = data?.data ?? [];

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Bell className="size-6 text-red-500" />
          Notificaciones
        </h1>
        {notifications.some((n) => !n.readAt) && (
          <Button size="sm" variant="outline" onClick={handleMarkAllRead} disabled={markingAllRead}>
            <Check className="size-4" />
            {markingAllRead ? 'Marcando...' : 'Marcar todas como leídas'}
          </Button>
        )}
      </div>

      {isLoading ? (
        <p className="text-white/60">Cargando notificaciones...</p>
      ) : notifications.length === 0 ? (
        <p className="text-white/60">No tienes notificaciones.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={cn(
                'flex items-start gap-3 rounded-xl border px-4 py-3 transition-colors',
                !notification.readAt
                  ? 'border-white/10 bg-white/5'
                  : 'border-white/5 bg-transparent',
              )}
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-red-600/20 text-red-500">
                <Bell className="size-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn('text-sm font-medium', !notification.readAt ? 'text-white' : 'text-white/60')}>
                  {notification.title}
                </p>
                <p className="mt-0.5 text-xs text-white/45">{notification.body}</p>
                <p className="mt-1 text-[11px] text-white/30">{formatTime(notification.createdAt)}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {!notification.readAt && (
                  <button
                    type="button"
                    onClick={() => handleMarkRead(notification.id)}
                    className="flex size-7 items-center justify-center rounded-full bg-white/10 text-white/60 transition-colors hover:bg-white/20 hover:text-white"
                    aria-label="Marcar como leída"
                  >
                    <Check className="size-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(notification.id)}
                  className="flex size-7 items-center justify-center rounded-full bg-white/10 text-white/60 transition-colors hover:bg-white/20 hover:text-white"
                  aria-label="Eliminar"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}