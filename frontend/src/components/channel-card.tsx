import Link from 'next/link';
import { Tv } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { gradientFor } from '@/lib/gradient';
import { cn } from '@/lib/utils';
import type { Channel } from '@/lib/api/types';

export function ChannelCard({ channel }: { channel: Channel }) {
  return (
    <Link href={`/canales/${channel.slug}`} className="group block w-full">
      <div
        className={cn(
          'relative aspect-video w-full overflow-hidden rounded-md ring-1 ring-white/10 transition-transform duration-200 group-hover:scale-105 group-hover:shadow-2xl',
          !channel.logoUrl && `bg-gradient-to-br ${gradientFor(channel.id)}`,
        )}
      >
        {channel.logoUrl ? (
          <div className="flex h-full w-full items-center justify-center bg-black p-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={channel.logoUrl} alt={channel.name} className="max-h-full max-w-full object-contain" />
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Tv className="size-8 text-white/50" />
          </div>
        )}

        <Badge className="absolute left-1.5 top-1.5 gap-1 bg-red-600 text-[10px] text-white hover:bg-red-600">
          <span className="size-1.5 rounded-full bg-white" />
          EN VIVO
        </Badge>
        {channel.isPremium && (
          <Badge className="absolute right-1.5 top-1.5 text-[10px]" variant="default">
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
