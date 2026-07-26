'use client';

import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { useContinueWatching } from '@/hooks/use-continue-watching';
import { Card, CardContent } from '@/components/ui/card';

export function ContinueWatchingList({ profileId }: { profileId: string }) {
  const { data, isLoading } = useContinueWatching(profileId);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-white">Continuar viendo</h1>

      {isLoading ? (
        <Loader2 className="size-6 animate-spin text-white/50" />
      ) : !data || data.data.length === 0 ? (
        <p className="text-white/60">Todavía no empezaste a ver nada.</p>
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
                <Card className="border-none bg-white/[0.04] ring-1 ring-white/10 transition-all hover:bg-white/[0.07] hover:ring-red-600/50">
                  <CardContent className="flex flex-col gap-2 pt-4">
                    <p className="font-medium text-white">{title}</p>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                      <div className="h-full bg-red-600" style={{ width: `${progressPct}%` }} />
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
