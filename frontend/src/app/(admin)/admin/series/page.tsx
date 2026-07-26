import Link from 'next/link';
import { Pencil } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { serverFetch } from '@/lib/api/server';
import type { Paginated, Series } from '@/lib/api/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DeleteSeriesButton } from './delete-series-button';

const STATUS_LABEL: Record<string, string> = { DRAFT: 'Borrador', PUBLISHED: 'Publicada', ARCHIVED: 'Archivada' };

export default async function AdminSeriesPage() {
  const user = await getCurrentUser();
  const query = user?.tenant ? `tenantId=${user.tenant.id}&limit=100` : 'limit=100';
  const result = await serverFetch<Paginated<Series>>(`/series/admin?${query}`, { withTenant: false });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Series</h1>
        <Link href="/admin/series/nueva">
          <Button className="bg-red-600 text-white hover:bg-red-700">Nueva serie</Button>
        </Link>
      </div>

      {result.data.length === 0 ? (
        <p className="text-white/60">Todavía no hay series.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-white/10">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-white/5 text-left text-white/60">
              <tr>
                <th className="px-4 py-2 font-medium">Título</th>
                <th className="px-4 py-2 font-medium">Categoría</th>
                <th className="px-4 py-2 font-medium">Estado</th>
                <th className="px-4 py-2 font-medium">Premium</th>
                <th className="px-4 py-2 font-medium">Kids</th>
                <th className="px-4 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {result.data.map((series) => (
                <tr key={series.id} className="border-t border-white/10">
                  <td className="px-4 py-2">{series.title}</td>
                  <td className="px-4 py-2 text-white/70">{series.category ?? '—'}</td>
                  <td className="px-4 py-2">
                    <Badge
                      variant="secondary"
                      className={
                        series.status === 'PUBLISHED'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : series.status === 'ARCHIVED'
                            ? 'bg-amber-500/20 text-amber-300'
                            : ''
                      }
                    >
                      {STATUS_LABEL[series.status] ?? series.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-2">{series.isPremium ? <Badge>Premium</Badge> : '—'}</td>
                  <td className="px-4 py-2 text-white/70">{series.isKids ? 'Sí' : '—'}</td>
                  <td className="px-4 py-2">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/admin/series/${series.id}/editar`}
                        className="flex size-8 items-center justify-center rounded-md text-white/50 transition-colors hover:bg-white/10 hover:text-white"
                        aria-label={`Editar ${series.title}`}
                      >
                        <Pencil className="size-4" />
                      </Link>
                      <DeleteSeriesButton id={series.id} title={series.title} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
