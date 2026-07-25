import { getCurrentUser } from '@/lib/auth/get-current-user';
import { HeaderShell } from './header-shell';

export async function SiteHeader() {
  const user = await getCurrentUser();
  return <HeaderShell user={user} />;
}
