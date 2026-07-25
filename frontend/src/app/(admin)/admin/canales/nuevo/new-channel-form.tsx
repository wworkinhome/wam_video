'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Hls from 'hls.js';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { clientFetch } from '@/lib/api/client';
import type { Tenant } from '@/lib/api/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

type TestStatus = 'idle' | 'testing' | 'ok' | 'error';

const DIACRITICS_REGEX = new RegExp('[̀-ͯ]', 'g');

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(DIACRITICS_REGEX, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function NewChannelForm({ tenants, defaultTenantId }: { tenants: Tenant[]; defaultTenantId: string | null }) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [tenantId, setTenantId] = useState(defaultTenantId ?? tenants[0]?.id ?? '');
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [logoUrl, setLogoUrl] = useState('');
  const [streamUrl, setStreamUrl] = useState('');
  const [category, setCategory] = useState('');
  const [isPremium, setIsPremium] = useState(false);

  const [testStatus, setTestStatus] = useState<TestStatus>('idle');
  const [saving, setSaving] = useState(false);

  function handleNameChange(value: string) {
    setName(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  function handleTest() {
    const video = videoRef.current;
    if (!video || !streamUrl.trim()) return;

    hlsRef.current?.destroy();
    setTestStatus('testing');

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl;
      video.onloadedmetadata = () => setTestStatus('ok');
      video.onerror = () => setTestStatus('error');
      video.play().catch(() => {});
    } else if (Hls.isSupported()) {
      const hls = new Hls();
      hlsRef.current = hls;
      hls.on(Hls.Events.MANIFEST_PARSED, () => setTestStatus('ok'));
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) setTestStatus('error');
      });
      hls.loadSource(streamUrl);
      hls.attachMedia(video);
      video.play().catch(() => {});
    } else {
      setTestStatus('error');
    }
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      await clientFetch('/channels', {
        method: 'POST',
        body: JSON.stringify({
          tenantId,
          name,
          slug,
          logoUrl: logoUrl || undefined,
          streamUrl: streamUrl || undefined,
          category: category || undefined,
          isPremium,
        }),
      });
      toast.success('Canal creado');
      router.push('/admin/canales');
      router.refresh();
    } catch {
      toast.error('No se pudo crear el canal (revisá el slug y los campos requeridos)');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-5">
      {tenants.length > 1 && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tenant">Tenant</Label>
          <select
            id="tenant"
            value={tenantId}
            onChange={(event) => setTenantId(event.target.value)}
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
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
        <Label htmlFor="name">Nombre</Label>
        <Input id="name" required value={name} onChange={(event) => handleNameChange(event.target.value)} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="slug">Slug</Label>
        <Input
          id="slug"
          required
          value={slug}
          onChange={(event) => {
            setSlugTouched(true);
            setSlug(event.target.value);
          }}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="category">Categoría</Label>
        <Input
          id="category"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          placeholder="Deportes, Noticias, Entretenimiento…"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="logoUrl">Logo (URL)</Label>
        <Input id="logoUrl" value={logoUrl} onChange={(event) => setLogoUrl(event.target.value)} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="streamUrl">Stream (m3u8)</Label>
        <div className="flex gap-2">
          <Input
            id="streamUrl"
            value={streamUrl}
            onChange={(event) => {
              setStreamUrl(event.target.value);
              setTestStatus('idle');
            }}
            placeholder="https://.../master.m3u8"
          />
          <Button type="button" variant="outline" onClick={handleTest} disabled={!streamUrl.trim()}>
            Probar
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm">
        {testStatus === 'testing' && (
          <span className="flex items-center gap-1.5 text-white/60">
            <Loader2 className="size-4 animate-spin" /> Probando señal…
          </span>
        )}
        {testStatus === 'ok' && (
          <span className="flex items-center gap-1.5 text-emerald-400">
            <CheckCircle2 className="size-4" /> La señal carga correctamente
          </span>
        )}
        {testStatus === 'error' && (
          <span className="flex items-center gap-1.5 text-red-400">
            <XCircle className="size-4" /> No se pudo cargar esta URL
          </span>
        )}
      </div>

      <video ref={videoRef} controls className="aspect-video w-full rounded-lg bg-black" />

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={isPremium} onChange={(event) => setIsPremium(event.target.checked)} />
        Canal premium
      </label>

      <Button type="submit" disabled={saving || !tenantId} className="bg-red-600 text-white hover:bg-red-700">
        {saving ? 'Guardando…' : 'Guardar canal'}
      </Button>
    </form>
  );
}
