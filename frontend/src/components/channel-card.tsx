'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { gradientFor } from '@/lib/gradient';
import { useHoverPreview } from '@/hooks/use-hover-preview';
import { cn } from '@/lib/utils';
import type { Channel } from '@/lib/api/types';

export function ChannelCard({ channel }: { channel: Channel }) {
  const { videoRef, previewing, start, stop } = useHoverPreview(channel.streamUrl);

  return (
    <Link href={`/canales/${channel.slug}`} className="group block w-full" onMouseEnter={start} onMouseLeave={stop}>
      <div
        className={cn(
          'card-hover relative aspect-video w-full overflow-hidden rounded-xl bg-[#0e0b0b] ring-1 ring-white/10 group-hover:ring-red-500/60',
          !channel.logoUrl && !previewing && `bg-gradient-to-br ${gradientFor(channel.id)}`,
        )}
      >
        {channel.logoUrl ? (
          <div
            className={cn(
              'flex h-full w-full items-center justify-center bg-[#0e0b0b] p-6 transition-opacity duration-300',
              previewing && 'opacity-0',
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={channel.logoUrl} alt={channel.name} className="max-h-full max-w-full object-contain" />
          </div>
        ) : (
          <div
            className={cn(
              'flex h-full w-full items-center justify-center p-4 transition-opacity duration-300',
              previewing && 'opacity-0',
            )}
          >
            <span className="line-clamp-2 text-center text-lg font-black tracking-tight text-white italic drop-shadow-md sm:text-xl">
              {channel.name}
            </span>
          </div>
        )}

        {channel.streamUrl && (
          <video
            ref={videoRef}
            muted
            playsInline
            className={cn(
              'absolute inset-0 h-full w-full object-cover transition-opacity duration-300',
              previewing ? 'opacity-100' : 'pointer-events-none opacity-0',
            )}
          />
        )}

        <Badge className="absolute left-1.5 top-1.5 gap-1 bg-red-600 text-[10px] text-primary-foreground hover:bg-red-600">
          <span className="size-1.5 rounded-full bg-white" />
          EN VIVO
        </Badge>
        {channel.isPremium && (
          <Badge className="absolute right-1.5 top-1.5 bg-accent-glow text-[10px] text-accent-glow-foreground" variant="default">
            Premium
          </Badge>
        )}

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent px-2.5 pb-1.5 pt-6">
          <p className="line-clamp-1 text-xs font-medium text-white">{channel.name}</p>
        </div>
      </div>
    </Link>
  );
}
