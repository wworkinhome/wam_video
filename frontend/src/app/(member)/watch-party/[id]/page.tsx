import { notFound, redirect } from 'next/navigation';
import { getActiveProfileId } from '@/lib/auth/active-profile';
import { serverFetch } from '@/lib/api/server';
import { ApiError, type PlaybackInfo, type WatchParty } from '@/lib/api/types';
import { WatchPartyRoom } from './watch-party-room';

export default async function WatchPartyRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profileId = await getActiveProfileId();
  if (!profileId) {
    redirect('/perfiles');
  }

  let party: WatchParty;
  try {
    party = await serverFetch<WatchParty>(`/watch-parties/${id}`, { withTenant: false });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  const contentPath = party.movieId
    ? `/playback/movies/${party.movieId}`
    : party.episodeId
      ? `/playback/episodes/${party.episodeId}`
      : null;
  if (!contentPath) notFound();

  let playback: PlaybackInfo;
  try {
    playback = await serverFetch<PlaybackInfo>(contentPath, { withTenant: false });
  } catch (error) {
    if (error instanceof ApiError && error.status === 403) {
      return (
        <div className="mx-auto flex max-w-md flex-col items-center gap-2 py-24 text-center">
          <p className="text-lg font-medium text-white">Contenido premium</p>
          <p className="text-white/60">Necesitás una suscripción activa para ver esto.</p>
        </div>
      );
    }
    throw error;
  }

  return (
    <WatchPartyRoom
      party={party}
      title={playback.title}
      src={playback.videoUrl}
      profileId={profileId}
      movieId={party.movieId ?? undefined}
      episodeId={party.episodeId ?? undefined}
    />
  );
}
