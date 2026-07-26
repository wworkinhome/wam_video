import Link from 'next/link';
import { serverFetch } from '@/lib/api/server';
import type { EpgChannelGuide } from '@/lib/api/types';
import { EpgGrid } from '@/components/epg-grid';
import { Badge } from '@/components/ui/badge';
import { CONTENT_CATEGORIES } from '@/lib/content-categories';
import { cn } from '@/lib/utils';

function findNowPlaying(guide: EpgChannelGuide[], now: number) {
  for (const { channel, programs } of guide) {
    const program = programs.find((p) => now >= new Date(p.startTime).getTime() && now < new Date(p.endTime).getTime());
    if (program) return { channel, program };
  }
  return null;
}

export default async function GuiaPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const fullGuide = await serverFetch<EpgChannelGuide[]>('/epg');
  const guide = category ? fullGuide.filter((g) => g.channel.category === category) : fullGuide;

  const nowMs = Date.now();
  const dayStart = new Date(nowMs);
  dayStart.setUTCHours(0, 0, 0, 0);

  const nowPlaying = findNowPlaying(guide, nowMs);

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(220,38,38,0.16),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:36px_36px]" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo_definitivo_transparent.png"
        alt=""
        className="animate-pulse-glow pointer-events-none absolute top-1/2 left-1/2 w-[680px] max-w-none -translate-x-1/2 -translate-y-1/2 opacity-[0.09] blur-2xl"
      />

      <div className="relative mx-auto flex w-full max-w-[1600px] flex-col gap-5 px-4 py-10 sm:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            {nowPlaying ? (
              <>
                <p className="text-xs font-medium text-white/50">
                  {new Date(nowPlaying.program.startTime).toLocaleDateString('es-CO', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                  })}{' '}
                  |{' '}
                  {new Date(nowPlaying.program.startTime).toLocaleTimeString('es-CO', {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}{' '}
                  -{' '}
                  {new Date(nowPlaying.program.endTime).toLocaleTimeString('es-CO', {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </p>
                <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">{nowPlaying.program.title}</h1>
                {nowPlaying.program.description && (
                  <p className="mt-1 max-w-xl text-sm text-white/60">{nowPlaying.program.description}</p>
                )}
              </>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-white">Guía de TV</h1>
                <p className="mt-1 text-sm text-white/60">Programación de hoy por canal.</p>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link href="/guia">
            <Badge
              variant={!category ? 'default' : 'secondary'}
              className={cn('cursor-pointer px-3 py-1 text-sm', !category && 'bg-red-600 hover:bg-red-600')}
            >
              Todos
            </Badge>
          </Link>
          {CONTENT_CATEGORIES.map((cat) => (
            <Link key={cat} href={`/guia?category=${encodeURIComponent(cat)}`}>
              <Badge
                variant={category === cat ? 'default' : 'secondary'}
                className={cn('cursor-pointer px-3 py-1 text-sm', category === cat && 'bg-red-600 hover:bg-red-600')}
              >
                {cat}
              </Badge>
            </Link>
          ))}
        </div>

        {guide.length === 0 ? (
          <p className="text-white/60">Todavía no hay canales con estos filtros.</p>
        ) : (
          <EpgGrid guide={guide} dayStartIso={dayStart.toISOString()} nowMs={nowMs} />
        )}
      </div>
    </div>
  );
}
