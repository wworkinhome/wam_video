import Link from 'next/link';
import { Clapperboard } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Series } from '@/lib/api/types';

export function SeriesCard({ series }: { series: Series }) {
  return (
    <Link href={`/series/${series.slug}`}>
      <Card className="h-full transition-shadow hover:shadow-lg">
        <div className="relative aspect-[2/3] w-full overflow-hidden bg-muted">
          {series.posterUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={series.posterUrl} alt={series.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Clapperboard className="size-10 text-muted-foreground" />
            </div>
          )}
          {series.isPremium && (
            <Badge className="absolute right-2 top-2" variant="default">
              Premium
            </Badge>
          )}
        </div>
        <CardContent className="pt-3">
          <p className="line-clamp-2 text-sm font-medium">{series.title}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
