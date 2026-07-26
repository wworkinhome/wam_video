import { Suspense } from 'react';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { HeaderShell } from './header-shell';

export async function SiteHeader() {
  const user = await getCurrentUser();
  return (
    <Suspense fallback={<HeaderShell user={user} />}>
      <HeaderShell user={user} />
    </Suspense>
  );
}
