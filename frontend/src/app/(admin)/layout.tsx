import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { hasPermission } from '@/lib/auth/permissions';
import { SiteLogo } from '@/components/site-logo';
import { AdminNav } from './admin-nav';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const canManage = user && (hasPermission(user, 'channels.manage') || hasPermission(user, 'content.manage'));
  if (!canManage) {
    redirect('/login');
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo_definitivo_transparent.png"
        alt=""
        className="animate-pulse-glow pointer-events-none absolute top-[28%] left-1/2 w-[640px] max-w-none -translate-x-1/2 opacity-[0.09] blur-2xl"
      />

      <div className="relative border-b border-white/10 bg-black/60 px-4 py-4 backdrop-blur-sm sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2">
            <SiteLogo className="h-9" />
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-white/70">
              Admin
            </span>
          </Link>
          <Link href="/" className="text-sm text-white/60 transition-colors hover:text-white">
            Volver al sitio
          </Link>
        </div>
      </div>
      <AdminNav />
      <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-8">{children}</div>
    </div>
  );
}
