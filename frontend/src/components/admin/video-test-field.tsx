'use client';

import { useRef, useState } from 'react';
import Hls from 'hls.js';
import { Film, type LucideIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type TestStatus = 'idle' | 'testing' | 'ok' | 'error';

const STATUS_CLASSES: Record<TestStatus, string> = {
  idle: 'bg-white/10 text-white/50',
  testing: 'bg-amber-500/20 text-amber-300',
  ok: 'bg-emerald-500/20 text-emerald-300',
  error: 'bg-red-500/20 text-red-300',
};

const STATUS_LABEL: Record<TestStatus, string> = {
  idle: 'SIN PROBAR',
  testing: 'PROBANDO…',
  ok: '● FUNCIONA',
  error: 'ERROR',
};

function useVideoTest(value: string) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [status, setStatus] = useState<TestStatus>('idle');

  function runTest() {
    const video = videoRef.current;
    if (!video || !value.trim()) return;

    hlsRef.current?.destroy();
    setStatus('testing');

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = value;
      video.onloadedmetadata = () => setStatus('ok');
      video.onerror = () => setStatus('error');
      video.play().catch(() => {});
    } else if (Hls.isSupported()) {
      const hls = new Hls();
      hlsRef.current = hls;
      hls.on(Hls.Events.MANIFEST_PARSED, () => setStatus('ok'));
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) setStatus('error');
      });
      hls.loadSource(value);
      hls.attachMedia(video);
      video.play().catch(() => {});
    } else {
      setStatus('error');
    }
  }

  return { videoRef, status, setStatus, runTest };
}

// Bloque completo (título + estado + preview grande): para el video principal de una película.
export function VideoTestField({
  id,
  label,
  value,
  onChange,
  placeholder,
  title = 'Video',
  icon: Icon = Film,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  title?: string;
  icon?: LucideIcon;
}) {
  const { videoRef, status, setStatus, runTest } = useVideoTest(value);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold text-white">
          <Icon className="size-5 text-red-500" />
          {title}
        </div>
        <span className={cn('rounded-full px-2.5 py-1 text-xs font-medium', STATUS_CLASSES[status])}>
          {STATUS_LABEL[status]}
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={id}>{label}</Label>
        <div className="flex gap-2">
          <Input
            id={id}
            value={value}
            onChange={(event) => {
              onChange(event.target.value);
              setStatus('idle');
            }}
            placeholder={placeholder}
          />
          <Button type="button" variant="outline" onClick={runTest} disabled={!value.trim()}>
            Probar
          </Button>
        </div>
      </div>

      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
        <video ref={videoRef} controls className="h-full w-full" />
        {status === 'idle' && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black text-white/40">
            <Icon className="size-8" />
            <p className="px-4 text-center text-sm">Ingresá una URL y presioná &quot;Probar&quot; para previsualizar</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Versión compacta (solo input + botón + preview chica): para formularios inline, ej. episodios.
export function VideoTestFieldCompact({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const { videoRef, status, setStatus, runTest } = useVideoTest(value);

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
            setStatus('idle');
          }}
          placeholder={placeholder}
          className="flex-1"
        />
        <Button type="button" size="sm" variant="outline" onClick={runTest} disabled={!value.trim()}>
          {status === 'testing' ? 'Probando…' : 'Probar'}
        </Button>
      </div>
      <div className="flex items-center gap-2">
        {status !== 'idle' && (
          <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium', STATUS_CLASSES[status])}>
            {STATUS_LABEL[status]}
          </span>
        )}
        <video
          ref={videoRef}
          controls
          className={cn(
            'rounded-md bg-black transition-all',
            status === 'idle' ? 'h-0 w-0 opacity-0' : 'aspect-video w-40',
          )}
        />
      </div>
    </div>
  );
}
