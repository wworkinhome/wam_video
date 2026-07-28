'use client';

import { Loader2 } from 'lucide-react';
import { useContinueWatching } from '@/hooks/use-continue-watching';
import { ContinueWatchingCard } from '@/components/continue-watching-row';

export function ContinueWatchingList({ profileId }: { profileId: string }) {
  const { data, isLoading } = useContinueWatching(profileId);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-white sm:text-3xl">Continuar viendo</h1>

      {isLoading ? (
        <Loader2 className="size-6 animate-spin text-white/50" />
      ) : !data || data.data.length === 0 ? (
        <p className="text-white/60">Todavía no empezaste a ver nada.</p>
      ) : (
        <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {data.data.map((item) => (
            <ContinueWatchingCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
