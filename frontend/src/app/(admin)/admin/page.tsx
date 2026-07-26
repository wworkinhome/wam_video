import Link from 'next/link';
import { Film, Clapperboard, Tv, Building2, Plus, Tags, Users } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { serverFetch } from '@/lib/api/server';
import type { Paginated, Movie, Series, Channel, AdminUser, ResolvedTenant } from '@/lib/api/types';
import { Button } from '@/components/ui/button';

async function safeCount<T>(promise: Promise<Paginated<T>>): Promise<number> {
  try {
    return (await promise).total;
  } catch {
    return 0;
  }
}

export default async function AdminDashboardPage() {
  const user = await getCurrentUser();
  const tenantQuery = user?.tenant ? `tenantId=${user.tenant.id}&` : '';

  const [movieCount, seriesCount, channelCount, userCount] = await Promise.all([
    safeCount(serverFetch<Paginated<Movie>>(`/movies/admin?${tenantQuery}limit=1`, { withTenant: false })),
    safeCount(serverFetch<Paginated<Series>>(`/series/admin?${tenantQuery}limit=1`, { withTenant: false })),
    safeCount(serverFetch<Paginated<Channel>>(`/channels?${tenantQuery}limit=1`, { withTenant: false })),
    safeCount(serverFetch<Paginated<AdminUser>>(`/users?${tenantQuery}limit=1`, { withTenant: false })),
  ]);

  const tenant = user?.tenant
    ? await serverFetch<ResolvedTenant>(`/tenants/${user.tenant.id}`, { withTenant: false }).catch(() => null)
    : null;

  const stats = [
    { label: 'Usuarios', value: userCount, icon: Users, href: '/admin/usuarios' },
    { label: 'Películas', value: movieCount, icon: Film, href: '/admin/peliculas' },
    { label: 'Series', value: seriesCount, icon: Clapperboard, href: '/admin/series' },
    { label: 'Canales', value: channelCount, icon: Tv, href: '/admin/canales' },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold">Panel de control</h1>
        <p className="mt-1 text-sm text-white/60">Resumen del catálogo y accesos rápidos.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-5 transition-colors hover:bg-white/10"
          >
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-red-600/15 text-red-500">
              <stat.icon className="size-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-sm text-white/60">{stat.label}</p>
            </div>
          </Link>
        ))}
      </div>

      {tenant && (
        <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-5">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/70">
            <Building2 className="size-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{tenant.name}</p>
            <p className="text-xs text-white/50">
              /{tenant.slug} {tenant.domain ? `· ${tenant.domain}` : ''}
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-bold tracking-wide text-white/60 uppercase">Acciones rápidas</h2>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/usuarios">
            <Button size="sm" variant="outline" className="gap-1.5">
              <Users className="size-4" />
              Gestionar usuarios
            </Button>
          </Link>
          <Link href="/admin/peliculas/nueva">
            <Button size="sm" className="gap-1.5 bg-red-600 text-white hover:bg-red-700">
              <Plus className="size-4" />
              Nueva película
            </Button>
          </Link>
          <Link href="/admin/series/nueva">
            <Button size="sm" className="gap-1.5 bg-red-600 text-white hover:bg-red-700">
              <Plus className="size-4" />
              Nueva serie
            </Button>
          </Link>
          <Link href="/admin/canales/nuevo">
            <Button size="sm" className="gap-1.5 bg-red-600 text-white hover:bg-red-700">
              <Plus className="size-4" />
              Nuevo canal
            </Button>
          </Link>
          <Link href="/admin/generos">
            <Button size="sm" variant="outline" className="gap-1.5">
              <Tags className="size-4" />
              Gestionar géneros
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
