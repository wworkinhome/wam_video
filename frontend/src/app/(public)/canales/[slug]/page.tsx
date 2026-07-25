import { notFound } from 'next/navigation';
import { Tv } from 'lucide-react';
import { serverFetch } from '@/lib/api/server';
import type { Paginated, Channel } from '@/lib/api/types';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { LivePlayer } from '@/components/live-player';
import { Badge } from '@/components/ui/badge';

export default async function ChannelDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await serverFetch<Paginated<Channel>>(`/channels?slug=${encodeURIComponent(slug)}&limit=1`);
  const channel = result.data[0];

  if (!channel) {
    notFound();
  }

  const user = channel.isPremium ? await getCurrentUser() : null;
  const blocked = channel.isPremium && !user;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-10 sm:px-8">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-white">{channel.name}</h1>
        <Badge className="gap-1 bg-red-600 text-white hover:bg-red-600">
          <span className="size-1.5 rounded-full bg-white" />
          EN VIVO
        </Badge>
        {channel.isPremium && <Badge>Premium</Badge>}
      </div>

      {blocked ? (
        <div className="flex flex-col items-center gap-2 rounded-lg bg-white/5 py-16 text-center">
          <Tv className="size-10 text-white/40" />
          <p className="text-lg font-medium text-white">Canal premium</p>
          <p className="text-white/60">Iniciá sesión para ver este canal.</p>
        </div>
      ) : channel.streamUrl ? (
        <LivePlayer src={channel.streamUrl} />
      ) : (
        <p className="text-white/60">Este canal todavía no tiene una señal configurada.</p>
      )}
    </div>
  );
}
