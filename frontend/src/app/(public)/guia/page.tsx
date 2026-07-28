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

function getDayStart(date: Date) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function formatDayLabel(date: Date) {
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const day = days[date.getUTCDay()];
  const month = months[date.getUTCMonth()];
  const dayNum = date.getUTCDate();
  return `${day} ${dayNum} ${month}`;
}

export default async function GuiaPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; date?: string }>;
}) {
  const { category, date } = await searchParams;
  const fullGuide = await serverFetch<EpgChannelGuide[]>('/epg');
  const guide = category ? fullGuide.filter((g) => g.channel.category === category) : fullGuide;

  const selectedDate = date ? new Date(date + 'T00:00:00Z') : new Date();
  const dayStart = getDayStart(selectedDate);
  const nowMs = Date.now();

  const nowPlaying = findNowPlaying(guide, nowMs);

  const days = Array.from({ length: 3 }, (_, i) => {
    const d = new Date(nowMs);
    d.setUTCDate(d.getUTCDate() + i);
    return d;
  });

  return (
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
              <p className="mt-1 text-sm text-white/60">Programación del {formatDayLabel(selectedDate)}</p>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href="/guia">
          <Badge
            variant={!category ? 'default' : 'secondary'}
            className={cn('cursor-pointer px-3 py-1 text-sm', !category && 'bg-red-600 text-white hover:bg-red-700')}
          >
            Todos
          </Badge>
        </Link>
        {CONTENT_CATEGORIES.map((cat) => (
          <Link key={cat} href={`/guia?category=${encodeURIComponent(cat)}${date ? `&date=${date}` : ''}`}>
            <Badge
              variant={category === cat ? 'default' : 'secondary'}
              className={cn('cursor-pointer px-3 py-1 text-sm', category === cat && 'bg-red-600 text-white hover:bg-red-700')}
            >
              {cat}
            </Badge>
          </Link>
        ))}
      </div>

      <div className="flex gap-2">
        {days.map((day) => {
          const isToday = day.toDateString() === new Date().toDateString();
          const isSelected = day.toDateString() === selectedDate.toDateString();
          const dayStr = day.toISOString().split('T')[0];
          return (
            <Link key={dayStr} href={`/guia${isToday ? '' : `?date=${dayStr}`}`}>
              <Badge
                variant={isSelected ? 'default' : 'secondary'}
                className={cn(
                  'cursor-pointer px-3 py-2 text-sm font-medium',
                  isSelected && 'bg-red-600 text-white hover:bg-red-700',
                  !isSelected && 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white',
                )}
              >
                {isToday ? 'Hoy' : formatDayLabel(day)}
              </Badge>
            </Link>
          );
        })}
      </div>

      {guide.length === 0 ? (
        <p className="text-white/60">Todavía no hay canales con estos filtros.</p>
      ) : (
        <EpgGrid guide={guide} dayStartIso={dayStart.toISOString()} nowMs={nowMs} />
      )}
    </div>
  );
}
