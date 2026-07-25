import { redirect } from 'next/navigation';
import { getActiveProfileId } from '@/lib/auth/active-profile';
import { ContinueWatchingList } from './continue-watching-list';

export default async function ContinueWatchingPage() {
  const profileId = await getActiveProfileId();
  if (!profileId) {
    redirect('/perfiles');
  }
  return <ContinueWatchingList profileId={profileId} />;
}
