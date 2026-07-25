'use client';

import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { useContinueWatching } from '@/hooks/use-continue-watching';
import { Card, CardContent } from '@/components/ui/card';

export function ContinueWatchingList({ profileId }: { profileId: string }) {
  const { data, isLoading } = useContinueWatching(profileId);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Continuar viendo</h1>

      {isLoading ? (
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      ) : !data || data.data.length === 0 ? (
        <p className="text-muted-foreground">Todavía no empezaste a ver nada.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {data.data.map((item) => {
            const title = item.movie?.title ?? item.episode?.title ?? 'Contenido';
            const href = item.movieId ? `/ver/pelicula/${item.movieId}` : `/ver/episodio/${item.episodeId}`;
            const progressPct = item.durationSeconds
              ? Math.min(100, Math.round((item.progressSeconds / item.durationSeconds) * 100))
              : 0;
            return (
              <Link key={item.id} href={href}>
                <Card className="transition-shadow hover:shadow-lg">
                  <CardContent className="flex flex-col gap-2 pt-4">
                    <p className="font-medium">{title}</p>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div className="h-full bg-primary" style={{ width: `${progressPct}%` }} />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
