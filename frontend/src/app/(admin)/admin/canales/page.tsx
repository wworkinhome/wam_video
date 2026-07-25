import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { serverFetch } from '@/lib/api/server';
import type { Paginated, Channel } from '@/lib/api/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default async function AdminChannelsPage() {
  const user = await getCurrentUser();
  const query = user?.tenant ? `tenantId=${user.tenant.id}&limit=100` : 'limit=100';
  const result = await serverFetch<Paginated<Channel>>(`/channels?${query}`, { withTenant: false });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Canales</h1>
        <Link href="/admin/canales/nuevo">
          <Button className="bg-red-600 text-white hover:bg-red-700">Nuevo canal</Button>
        </Link>
      </div>

      {result.data.length === 0 ? (
        <p className="text-white/60">Todavía no hay canales.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-left text-white/60">
              <tr>
                <th className="px-4 py-2 font-medium">Nombre</th>
                <th className="px-4 py-2 font-medium">Categoría</th>
                <th className="px-4 py-2 font-medium">Premium</th>
                <th className="px-4 py-2 font-medium">Stream</th>
              </tr>
            </thead>
            <tbody>
              {result.data.map((channel) => (
                <tr key={channel.id} className="border-t border-white/10">
                  <td className="px-4 py-2">{channel.name}</td>
                  <td className="px-4 py-2 text-white/70">{channel.category ?? '—'}</td>
                  <td className="px-4 py-2">{channel.isPremium ? <Badge>Premium</Badge> : '—'}</td>
                  <td className="max-w-xs truncate px-4 py-2 text-white/50">{channel.streamUrl ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
