'use client';

import { Loader2, X } from 'lucide-react';
import { useFavorites, useRemoveFavorite } from '@/hooks/use-favorites';
import { MovieCard } from '@/components/movie-card';
import { SeriesCard } from '@/components/series-card';
import { Button } from '@/components/ui/button';

export function FavoritesList({ profileId }: { profileId: string }) {
  const { data, isLoading } = useFavorites(profileId);
  const removeFavorite = useRemoveFavorite(profileId);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Favoritos</h1>

      {isLoading ? (
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      ) : !data || data.data.length === 0 ? (
        <p className="text-muted-foreground">Todavía no tenés favoritos.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {data.data.map((favorite) => (
            <div key={favorite.id} className="relative">
              {favorite.movie && <MovieCard movie={favorite.movie} />}
              {favorite.series && <SeriesCard series={favorite.series} />}
              <Button
                size="icon-sm"
                variant="secondary"
                className="absolute right-2 top-2 z-10"
                onClick={() => removeFavorite.mutate(favorite.id)}
              >
                <X className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
