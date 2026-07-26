import { notFound, redirect } from 'next/navigation';
import { getActiveProfileId } from '@/lib/auth/active-profile';
import { serverFetch } from '@/lib/api/server';
import { ApiError, type PlaybackInfo, type WatchHistoryItem } from '@/lib/api/types';
import { FullscreenPlayer } from '@/components/fullscreen-player';

export default async function WatchEpisodePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profileId = await getActiveProfileId();
  if (!profileId) {
    redirect('/perfiles');
  }

  let playback: PlaybackInfo;
  try {
    playback = await serverFetch<PlaybackInfo>(`/playback/episodes/${id}`, { withTenant: false });
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

  // Reanudar desde donde quedó ("continuar viendo"), si hay progreso guardado.
  const savedProgress = await serverFetch<WatchHistoryItem | null>(
    `/profiles/${profileId}/continue-watching/progress?episodeId=${id}`,
    { withTenant: false },
  ).catch(() => null);

  if (!playback.videoUrl) {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-center">
        <h1 className="text-xl font-semibold">{playback.title}</h1>
        <p className="text-muted-foreground">Este contenido no tiene un video disponible.</p>
      </div>
    );
  }

  return (
    <FullscreenPlayer
      title={playback.title}
      src={playback.videoUrl}
      profileId={profileId}
      episodeId={id}
      mediaTracks={playback.mediaTracks}
      initialProgressSeconds={savedProgress?.progressSeconds}
    />
  );
}
