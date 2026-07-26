import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Tv } from 'lucide-react';
import { serverFetch } from '@/lib/api/server';
import type { Paginated, Channel } from '@/lib/api/types';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { LiveChannelPlayer } from '@/components/live-channel-player';

export default async function ChannelDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await serverFetch<Paginated<Channel>>(`/channels?slug=${encodeURIComponent(slug)}&limit=1`);
  const channel = result.data[0];

  if (!channel) {
    notFound();
  }

  const user = channel.isPremium ? await getCurrentUser() : null;
  const blocked = channel.isPremium && !user;

  if (blocked || !channel.streamUrl) {
    return (
      <div className="fixed inset-0 z-100 flex flex-col items-center justify-center gap-3 bg-black px-4 text-center">
        <Link
          href="/canales"
          aria-label="Volver"
          className="absolute top-4 left-4 flex size-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:top-6 sm:left-6"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <Tv className="size-10 text-white/40" />
        <p className="text-lg font-medium text-white">{blocked ? 'Canal premium' : channel.name}</p>
        <p className="text-white/60">
          {blocked ? 'Iniciá sesión para ver este canal.' : 'Este canal todavía no tiene una señal configurada.'}
        </p>
      </div>
    );
  }

  return <LiveChannelPlayer channel={channel} />;
}
