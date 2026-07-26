'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Search } from 'lucide-react';
import { clientFetch } from '@/lib/api/client';
import type { AdminUser, Paginated, Plan } from '@/lib/api/types';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Activo',
  SUSPENDED: 'Suspendido',
  PENDING_VERIFICATION: 'Pendiente',
  DELETED: 'Eliminado',
};

const PLAN_TABS: { value: '' | 'free' | 'premium'; label: string }[] = [
  { value: '', label: 'Todos' },
  { value: 'free', label: 'Gratis' },
  { value: 'premium', label: 'Premium' },
];

export function UsersManager({
  initialUsers,
  plans,
  currentUserId,
}: {
  initialUsers: AdminUser[];
  plans: Plan[];
  currentUserId: string;
}) {
  const [users, setUsers] = useState(initialUsers);
  const [q, setQ] = useState('');
  const [planFilter, setPlanFilter] = useState<'' | 'free' | 'premium'>('');
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [loadedOnce, setLoadedOnce] = useState(false);

  useEffect(() => {
    if (!loadedOnce && q === '' && planFilter === '') {
      setLoadedOnce(true);
      return;
    }
    const handle = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ limit: '100' });
        if (q.trim()) params.set('q', q.trim());
        if (planFilter) params.set('plan', planFilter);
        const result = await clientFetch<Paginated<AdminUser>>(`/users?${params.toString()}`);
        setUsers(result.data);
      } catch {
        toast.error('No se pudieron cargar los usuarios');
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, planFilter]);

  async function toggleStatus(target: AdminUser) {
    const nextStatus = target.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
    setBusyId(target.id);
    try {
      const updated = await clientFetch<AdminUser>(`/users/${target.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      });
      setUsers((prev) => prev.map((item) => (item.id === target.id ? updated : item)));
      toast.success(nextStatus === 'SUSPENDED' ? 'Usuario suspendido' : 'Usuario reactivado');
    } catch {
      toast.error('No se pudo actualizar el estado');
    } finally {
      setBusyId(null);
    }
  }

  async function changePlan(target: AdminUser, planId: string) {
    setBusyId(target.id);
    try {
      const updated = await clientFetch<AdminUser>(`/users/${target.id}/plan`, {
        method: 'PATCH',
        body: JSON.stringify({ planId: planId || null }),
      });
      setUsers((prev) => prev.map((item) => (item.id === target.id ? updated : item)));
      toast.success('Plan actualizado');
    } catch {
      toast.error('No se pudo actualizar el plan');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-white/40" />
          <Input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Buscar por nombre o email…"
            className="pl-9"
          />
        </div>
        <div className="flex gap-1 rounded-full border border-white/10 bg-white/5 p-1">
          {PLAN_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setPlanFilter(tab.value)}
              className={cn(
                'rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
                planFilter === tab.value ? 'bg-red-600 text-white' : 'text-white/60 hover:text-white',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-white/10">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="bg-white/5 text-left text-white/60">
            <tr>
              <th className="px-4 py-2 font-medium">Usuario</th>
              <th className="px-4 py-2 font-medium">Estado</th>
              <th className="px-4 py-2 font-medium">Plan</th>
              <th className="px-4 py-2 font-medium">Registrado</th>
              <th className="px-4 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((item) => (
              <tr key={item.id} className="border-t border-white/10">
                <td className="px-4 py-2">
                  <p className="font-medium text-white">{item.name}</p>
                  <p className="text-xs text-white/50">{item.email}</p>
                </td>
                <td className="px-4 py-2">
                  <Badge
                    variant={item.status === 'ACTIVE' ? 'secondary' : item.status === 'SUSPENDED' ? 'destructive' : 'outline'}
                  >
                    {STATUS_LABEL[item.status] ?? item.status}
                  </Badge>
                </td>
                <td className="px-4 py-2">
                  {item.isStaff ? (
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-white/10 text-white/70">
                        Admin
                      </Badge>
                      <span className="text-xs text-white/40">Gestiona la plataforma, no aplica plan</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {item.plan ? (
                        <Badge
                          variant={item.plan.isFree ? 'outline' : 'default'}
                          className={item.plan.isFree ? '' : 'bg-red-600 text-white'}
                        >
                          {item.plan.isFree ? 'Gratis' : 'Premium'}
                        </Badge>
                      ) : (
                        <Badge variant="outline">Sin plan</Badge>
                      )}
                      <select
                        value={item.plan?.planId ?? ''}
                        disabled={busyId === item.id}
                        onChange={(event) => changePlan(item, event.target.value)}
                        className="rounded-md border border-white/15 bg-black/40 px-2 py-1 text-xs text-white outline-none focus:border-red-600/60"
                      >
                        <option value="">Sin plan</option>
                        {plans.map((plan) => (
                          <option key={plan.id} value={plan.id}>
                            {plan.name} · {Number(plan.price) === 0 ? 'Gratis' : `$${plan.price}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </td>
                <td className="px-4 py-2 text-white/60">{item.createdAt.slice(0, 10)}</td>
                <td className="px-4 py-2 text-right">
                  {item.id !== currentUserId && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={busyId === item.id}
                      onClick={() => toggleStatus(item)}
                      className={item.status === 'SUSPENDED' ? '' : 'text-destructive hover:bg-destructive/10'}
                    >
                      {item.status === 'SUSPENDED' ? 'Reactivar' : 'Suspender'}
                    </Button>
                  )}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-white/50">
                  {loading ? 'Cargando…' : 'No se encontraron usuarios.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
