import Link from 'next/link';
import { Film } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { gradientFor } from '@/lib/gradient';
import { cn } from '@/lib/utils';

export function PosterCard({
  id,
  href,
  title,
  posterUrl,
  isPremium,
}: {
  id: string;
  href: string;
  title: string;
  posterUrl: string | null;
  isPremium?: boolean;
}) {
  return (
    <Link href={href} className="group block w-full">
      <div
        className={cn(
          'relative aspect-[2/3] w-full overflow-hidden rounded-lg ring-1 ring-white/10 transition-all duration-200 group-hover:scale-105 group-hover:shadow-2xl group-hover:ring-red-600/60',
          !posterUrl && `bg-gradient-to-br ${gradientFor(id)}`,
        )}
      >
        {posterUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={posterUrl} alt={title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Film className="size-8 text-white/50" />
          </div>
        )}

        {isPremium && (
          <Badge className="absolute top-1.5 right-1.5 text-[10px]" variant="default">
            Premium
          </Badge>
        )}

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent px-2 pt-6 pb-1.5">
          <p className="line-clamp-1 text-xs font-medium text-white">{title}</p>
        </div>
      </div>
    </Link>
  );
}
