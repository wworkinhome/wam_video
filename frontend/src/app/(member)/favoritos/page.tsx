import { redirect } from 'next/navigation';
import { getActiveProfileId } from '@/lib/auth/active-profile';
import { FavoritesList } from './favorites-list';

export default async function FavoritesPage() {
  const profileId = await getActiveProfileId();
  if (!profileId) {
    redirect('/perfiles');
  }
  return <FavoritesList profileId={profileId} />;
}
