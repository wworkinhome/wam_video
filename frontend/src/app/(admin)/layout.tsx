import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { hasPermission } from '@/lib/auth/permissions';

// Rebanada mínima de CMS: hoy solo gestiona Canales (lo único que se pidió
// construir). Ampliar el gate a más permisos a medida que se agreguen secciones.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user, 'channels.manage')) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="border-b border-white/10 bg-black/95 px-4 py-4 sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/admin/canales" className="text-lg font-semibold tracking-tight text-red-600">
            WAMVIDEO Admin
          </Link>
          <Link href="/" className="text-sm text-white/60 hover:text-white">
            Volver al sitio
          </Link>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8">{children}</div>
    </div>
  );
}
