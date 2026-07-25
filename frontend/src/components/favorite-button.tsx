'use client';

import { Heart } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useAddFavorite } from '@/hooks/use-favorites';

interface FavoriteButtonProps {
  profileId: string;
  movieId?: string;
  seriesId?: string;
}

export function FavoriteButton({ profileId, movieId, seriesId }: FavoriteButtonProps) {
  const addFavorite = useAddFavorite(profileId);

  return (
    <Button
      variant="outline"
      disabled={addFavorite.isPending}
      onClick={() =>
        addFavorite.mutate(
          { movieId, seriesId },
          {
            onSuccess: () => toast.success('Agregado a favoritos'),
            onError: () => toast.error('No se pudo agregar a favoritos'),
          },
        )
      }
    >
      <Heart className="size-4" /> Favorito
    </Button>
  );
}
