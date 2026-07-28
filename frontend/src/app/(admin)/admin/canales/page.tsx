import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { serverFetch } from '@/lib/api/server';
import type { Paginated, Channel } from '@/lib/api/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { countryName } from '@/lib/countries';
import { cn } from '@/lib/utils';
import { DeleteChannelButton } from './delete-channel-button';
import { Pencil } from 'lucide-react';

const PAGE_SIZE = 50;

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Todos los estados' },
  { value: 'ok', label: '● Funcionando' },
  { value: 'broken', label: '● Roto' },
  { value: 'unchecked', label: 'Sin probar' },
];

function statusBadge(channel: Channel) {
  if (channel.streamStatus === 'ok') {
    return <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-400">OK</span>;
  }
  if (channel.streamStatus === 'broken') {
    return <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-medium text-red-400">Roto</span>;
  }
  return <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-medium text-white/40">Sin probar</span>;
}

export default async function AdminChannelsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  const { status, q, page } = await searchParams;
  const user = await getCurrentUser();
  const currentPage = Math.max(1, Number(page) || 1);

  const params = new URLSearchParams();
  if (user?.tenant) params.set('tenantId', user.tenant.id);
  params.set('limit', String(PAGE_SIZE));
  params.set('page', String(currentPage));
  if (status) params.set('status', status);
  if (q) params.set('q', q);

  const result = await serverFetch<Paginated<Channel>>(`/channels?${params.toString()}`, { withTenant: false });
  const totalPages = Math.max(1, Math.ceil(result.total / PAGE_SIZE));

  function pageHref(targetPage: number) {
    const p = new URLSearchParams();
    if (status) p.set('status', status);
    if (q) p.set('q', q);
    p.set('page', String(targetPage));
    return `/admin/canales?${p.toString()}`;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Canales</h1>
        <div className="flex gap-2">
          <Link href="/admin/canales/importar">
            <Button variant="outline">Importar M3U</Button>
          </Link>
          <Link href="/admin/canales/nuevo">
            <Button className="bg-red-600 text-white hover:bg-red-700">Nuevo canal</Button>
          </Link>
        </div>
      </div>

      <form className="flex flex-wrap items-center gap-2" action="/admin/canales">
        <input
          type="search"
          name="q"
          defaultValue={q ?? ''}
          placeholder="Buscar por nombre..."
          className="h-9 w-56 rounded-md border border-white/15 bg-white/5 px-3 text-sm text-white placeholder:text-white/40"
        />
        <select
          name="status"
          defaultValue={status ?? ''}
          className="h-9 rounded-md border border-white/15 bg-white/5 px-2 text-sm text-white"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-black">
              {opt.label}
            </option>
          ))}
        </select>
        <Button type="submit" variant="outline">
          Filtrar
        </Button>
        <span className="ml-auto text-sm text-white/40">{result.total} canales</span>
      </form>

      {result.data.length === 0 ? (
        <p className="text-white/60">No hay canales que coincidan con el filtro.</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-white/10">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="bg-white/5 text-left text-white/60">
                <tr>
                  <th className="px-4 py-2 font-medium">Nombre</th>
                  <th className="px-4 py-2 font-medium">Categoría</th>
                  <th className="px-4 py-2 font-medium">País</th>
                  <th className="px-4 py-2 font-medium">Premium</th>
                  <th className="px-4 py-2 font-medium">Estado</th>
                  <th className="px-4 py-2 font-medium">Stream</th>
                  <th className="px-4 py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {result.data.map((channel) => (
                  <tr key={channel.id} className="border-t border-white/10">
                    <td className="px-4 py-2">{channel.name}</td>
                    <td className="px-4 py-2 text-white/70">{channel.category ?? '—'}</td>
                    <td className="px-4 py-2 text-white/70">{countryName(channel.country) ?? '—'}</td>
                    <td className="px-4 py-2">{channel.isPremium ? <Badge>Premium</Badge> : '—'}</td>
                    <td className="px-4 py-2">{statusBadge(channel)}</td>
                    <td className="max-w-xs truncate px-4 py-2 text-white/50">{channel.streamUrl ?? '—'}</td>
                    <td className="px-4 py-2">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/admin/canales/${channel.id}/editar`}
                          className="flex size-8 items-center justify-center rounded-md text-white/50 transition-colors hover:bg-white/10 hover:text-white"
                          aria-label={`Editar ${channel.name}`}
                        >
                          <Pencil className="size-4" />
                        </Link>
                        <DeleteChannelButton id={channel.id} name={channel.name} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 text-sm">
              <Link
                href={pageHref(Math.max(1, currentPage - 1))}
                aria-disabled={currentPage <= 1}
                className={cn(
                  'rounded-md px-3 py-1.5 text-white/70 hover:bg-white/10 hover:text-white',
                  currentPage <= 1 && 'pointer-events-none opacity-30',
                )}
              >
                Anterior
              </Link>
              <span className="text-white/50">
                Página {currentPage} de {totalPages}
              </span>
              <Link
                href={pageHref(Math.min(totalPages, currentPage + 1))}
                aria-disabled={currentPage >= totalPages}
                className={cn(
                  'rounded-md px-3 py-1.5 text-white/70 hover:bg-white/10 hover:text-white',
                  currentPage >= totalPages && 'pointer-events-none opacity-30',
                )}
              >
                Siguiente
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
