import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { SiteHeader } from '@/components/site-header';

// proxy.ts ya hace un check "optimista" (¿existe la cookie?) antes de llegar acá,
// pero según la propia guía de Next.js el Proxy no reemplaza la verificación real
// de sesión — por eso se repite acá con una llamada real a GET /auth/me.
export default async function MemberLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
    </>
  );
}
