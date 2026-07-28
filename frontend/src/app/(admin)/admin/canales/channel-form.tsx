'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Hls from 'hls.js';
import { Radio, Tv } from 'lucide-react';
import { clientFetch } from '@/lib/api/client';
import { CONTENT_CATEGORIES } from '@/lib/content-categories';
import { COUNTRIES } from '@/lib/countries';
import type { Channel, Tenant } from '@/lib/api/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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

type ChannelFormProps =
  | { mode: 'create'; tenants: Tenant[]; defaultTenantId: string | null; channel?: undefined }
  | { mode: 'edit'; tenants?: undefined; defaultTenantId?: undefined; channel: Channel };

export function ChannelForm(props: ChannelFormProps) {
  const isEdit = props.mode === 'edit';
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [tenantId, setTenantId] = useState(
    isEdit ? props.channel.tenantId : (props.defaultTenantId ?? props.tenants[0]?.id ?? ''),
  );
  const [name, setName] = useState(isEdit ? props.channel.name : '');
  const [slug, setSlug] = useState(isEdit ? props.channel.slug : '');
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [logoUrl, setLogoUrl] = useState(isEdit ? (props.channel.logoUrl ?? '') : '');
  const [streamUrl, setStreamUrl] = useState(isEdit ? (props.channel.streamUrl ?? '') : '');
  const [category, setCategory] = useState(isEdit ? (props.channel.category ?? '') : '');
  const [country, setCountry] = useState(isEdit ? (props.channel.country ?? '') : '');
  const [isPremium, setIsPremium] = useState(isEdit ? props.channel.isPremium : false);
  const [dvrEnabled, setDvrEnabled] = useState(isEdit ? props.channel.dvrEnabled : false);
  const [catchupWindowHours, setCatchupWindowHours] = useState(
    isEdit ? (props.channel.catchupWindowHours?.toString() ?? '') : '',
  );
  const [catchupUrlTemplate, setCatchupUrlTemplate] = useState(
    isEdit ? (props.channel.catchupUrlTemplate ?? '') : '',
  );

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
      const body = {
        name,
        slug,
        logoUrl: logoUrl || undefined,
        streamUrl: streamUrl || undefined,
        category: category || undefined,
        country: country || undefined,
        isPremium,
        dvrEnabled,
        catchupWindowHours: catchupWindowHours ? Number(catchupWindowHours) : undefined,
        catchupUrlTemplate: catchupUrlTemplate || undefined,
      };
      if (isEdit) {
        await clientFetch(`/channels/${props.channel.id}`, { method: 'PATCH', body: JSON.stringify(body) });
        toast.success('Canal actualizado');
      } else {
        await clientFetch('/channels', { method: 'POST', body: JSON.stringify({ ...body, tenantId }) });
        toast.success('Canal creado');
      }
      router.push('/admin/canales');
      router.refresh();
    } catch {
      toast.error(isEdit ? 'No se pudo actualizar el canal' : 'No se pudo crear el canal (revisá el slug y los campos requeridos)');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-5">
      {!isEdit && props.tenants.length > 1 && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tenant">Tenant</Label>
          <select
            id="tenant"
            value={tenantId}
            onChange={(event) => setTenantId(event.target.value)}
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
          >
            {props.tenants.map((tenant) => (
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
          list="channel-categories"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          placeholder="Deportes, Noticias, Música, Kids…"
        />
        <datalist id="channel-categories">
          {CONTENT_CATEGORIES.map((cat) => (
            <option key={cat} value={cat} />
          ))}
        </datalist>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="country">País</Label>
        <select
          id="country"
          value={country}
          onChange={(event) => setCountry(event.target.value)}
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
        >
          <option value="" className="bg-black">
            Sin especificar
          </option>
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code} className="bg-black">
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="logoUrl">Logo (URL)</Label>
        <Input id="logoUrl" value={logoUrl} onChange={(event) => setLogoUrl(event.target.value)} />
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-white">
            <Radio className="size-5 text-red-500" />
            Señal del canal
          </div>
          <span
            className={cn(
              'rounded-full px-2.5 py-1 text-xs font-medium',
              testStatus === 'idle' && 'bg-white/10 text-white/50',
              testStatus === 'testing' && 'bg-amber-500/20 text-amber-300',
              testStatus === 'ok' && 'bg-emerald-500/20 text-emerald-300',
              testStatus === 'error' && 'bg-red-500/20 text-red-300',
            )}
          >
            {testStatus === 'idle' && 'SIN PROBAR'}
            {testStatus === 'testing' && 'PROBANDO…'}
            {testStatus === 'ok' && '● EN VIVO'}
            {testStatus === 'error' && 'SIN SEÑAL'}
          </span>
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

        <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
          <video ref={videoRef} controls className="h-full w-full" />
          {testStatus === 'idle' && (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black text-white/40">
              <Tv className="size-8" />
              <p className="px-4 text-center text-sm">Ingresá una URL y presioná "Probar" para previsualizar</p>
            </div>
          )}
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={isPremium} onChange={(event) => setIsPremium(event.target.checked)} />
        Canal premium
      </label>

      <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
        <label className="flex items-center gap-2 text-sm font-semibold text-white">
          <input type="checkbox" checked={dvrEnabled} onChange={(event) => setDvrEnabled(event.target.checked)} />
          DVR / rebobinar TV en vivo
        </label>
        {dvrEnabled && (
          <>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="catchupWindowHours">Ventana de rebobinado (horas)</Label>
              <Input
                id="catchupWindowHours"
                type="number"
                min={1}
                value={catchupWindowHours}
                onChange={(event) => setCatchupWindowHours(event.target.value)}
                placeholder="4"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="catchupUrlTemplate">Plantilla de URL de catch-up del proveedor</Label>
              <Input
                id="catchupUrlTemplate"
                value={catchupUrlTemplate}
                onChange={(event) => setCatchupUrlTemplate(event.target.value)}
                placeholder="https://.../live.m3u8?utc={start}&lutc={now}"
              />
              <p className="text-xs text-white/40">
                Placeholders disponibles: <code>{'{start}'}</code> y <code>{'{now}'}</code> (unix
                seconds). Cada proveedor IPTV usa su propia convención — sin esto, el canal no
                puede rebobinar aunque tenga DVR activado.
              </p>
            </div>
          </>
        )}
      </div>

      <Button type="submit" disabled={saving || (!isEdit && !tenantId)} className="bg-red-600 text-white hover:bg-red-700">
        {saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Guardar canal'}
      </Button>
    </form>
  );
}
