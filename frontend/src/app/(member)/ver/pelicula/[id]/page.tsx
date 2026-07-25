import { notFound, redirect } from 'next/navigation';
import { getActiveProfileId } from '@/lib/auth/active-profile';
import { serverFetch } from '@/lib/api/server';
import { ApiError, type PlaybackInfo } from '@/lib/api/types';
import { Player } from '@/components/player';

export default async function WatchMoviePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profileId = await getActiveProfileId();
  if (!profileId) {
    redirect('/perfiles');
  }

  let playback: PlaybackInfo;
  try {
    playback = await serverFetch<PlaybackInfo>(`/playback/movies/${id}`, { withTenant: false });
  } catch (error) {
    if (error instanceof ApiError && error.status === 403) {
      return (
        <div className="flex flex-col items-center gap-2 py-16 text-center">
          <p className="text-lg font-medium">Contenido premium</p>
          <p className="text-muted-foreground">Necesitás una suscripción activa para ver esto.</p>
        </div>
      );
    }
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">{playback.title}</h1>
      {playback.videoUrl ? (
        <Player src={playback.videoUrl} profileId={profileId} movieId={id} mediaTracks={playback.mediaTracks} />
      ) : (
        <p className="text-muted-foreground">Este contenido no tiene un video disponible.</p>
      )}
    </div>
  );
}
