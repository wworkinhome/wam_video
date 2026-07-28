'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { clientFetch } from '@/lib/api/client';
import type { Tenant } from '@/lib/api/types';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface ImportResult {
  total: number;
  created: number;
  updated: number;
  skipped: number;
}

export function ImportChannelsForm({ tenants, defaultTenantId }: { tenants: Tenant[]; defaultTenantId: string | null }) {
  const [tenantId, setTenantId] = useState(defaultTenantId ?? tenants[0]?.id ?? '');
  const [m3u, setM3u] = useState('');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  async function handleImport(event: React.FormEvent) {
    event.preventDefault();
    if (!m3u.trim()) return;
    setImporting(true);
    setResult(null);
    try {
      const data = await clientFetch<ImportResult>('/channels/import', {
        method: 'POST',
        body: JSON.stringify({ tenantId, m3u }),
      });
      setResult(data);
      toast.success(`Importación lista: ${data.created} nuevos, ${data.updated} actualizados`);
    } catch {
      toast.error('No se pudo importar la playlist');
    } finally {
      setImporting(false);
    }
  }

  return (
    <form onSubmit={handleImport} className="flex flex-col gap-4">
      {tenants.length > 1 && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tenant">Tenant</Label>
          <select
            id="tenant"
            value={tenantId}
            onChange={(event) => setTenantId(event.target.value)}
            className="h-9 rounded-md border border-white/15 bg-white/5 px-2 text-sm text-white"
          >
            {tenants.map((tenant) => (
              <option key={tenant.id} value={tenant.id} className="bg-black">
                {tenant.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="m3u">Playlist M3U</Label>
        <textarea
          id="m3u"
          value={m3u}
          onChange={(event) => setM3u(event.target.value)}
          rows={14}
          placeholder={'#EXTM3U\n#EXTINF:-1 tvg-logo="https://..." group-title="Noticias",CNN en Español\nhttps://stream.example.com/live.m3u8'}
          className="rounded-md border border-white/15 bg-white/5 p-3 font-mono text-xs text-white placeholder:text-white/30"
        />
      </div>

      <Button type="submit" disabled={importing || !m3u.trim()} className="w-fit bg-red-600 text-white hover:bg-red-700">
        {importing ? 'Importando…' : 'Importar'}
      </Button>

      {result && (
        <div className="flex flex-col gap-2 rounded-lg border border-white/10 bg-white/5 p-4 text-sm">
          <p className="text-white/85">
            {result.total} canales detectados — {result.created} nuevos, {result.updated} actualizados,{' '}
            {result.skipped} omitidos (sin URL válida o error).
          </p>
          <Link href="/admin/canales" className="w-fit text-red-500 hover:underline">
            Ver canales
          </Link>
        </div>
      )}
    </form>
  );
}
