'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { gradientFor } from '@/lib/gradient';
import type { EpgChannelGuide } from '@/lib/api/types';

const PX_PER_MIN = 4;
const DAY_MINUTES = 24 * 60;
const LEFT_COL_WIDTH = 100;
const ROW_HEIGHT = 80;
const TIMELINE_WIDTH = DAY_MINUTES * PX_PER_MIN;

function minutesSince(dayStart: Date, iso: string) {
  return (new Date(iso).getTime() - dayStart.getTime()) / 60000;
}

// Formateo manual (sin Intl/toLocaleTimeString): distintas versiones de ICU entre
// Node y el navegador insertan espacios distintos alrededor de "a. m."/"p. m.",
// lo que generaba un hydration mismatch real en cada carga de esta página.
function formatHour(date: Date) {
  const hours24 = date.getHours();
  const minutes = date.getMinutes();
  const period = hours24 < 12 ? 'a.m.' : 'p.m.';
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${hours12}:${String(minutes).padStart(2, '0')} ${period}`;
}

function formatRange(startIso: string, endIso: string) {
  return `${formatHour(new Date(startIso))} - ${formatHour(new Date(endIso))}`;
}

export function EpgGrid({
  guide,
  dayStartIso,
  nowMs,
}: {
  guide: EpgChannelGuide[];
  dayStartIso: string;
  nowMs: number;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const dayStart = new Date(dayStartIso);
  const now = nowMs;
  const nowOffsetMin = Math.min(DAY_MINUTES, Math.max(0, (now - dayStart.getTime()) / 60000));
  const nowLeft = LEFT_COL_WIDTH + nowOffsetMin * PX_PER_MIN;

  useEffect(() => {
    scrollRef.current?.scrollTo({ left: Math.max(0, nowOffsetMin * PX_PER_MIN - 200) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const columns = Array.from({ length: DAY_MINUTES / 30 }, (_, i) => {
    const time = new Date(dayStart.getTime() + i * 30 * 60 * 1000);
    return { left: i * 30 * PX_PER_MIN, label: formatHour(time) };
  });

  return (
    <div ref={scrollRef} className="overflow-x-auto rounded-xl bg-[#0e0b0b]/45 ring-1 ring-white/10 backdrop-blur-[2px]">
      <div className="relative" style={{ width: LEFT_COL_WIDTH + TIMELINE_WIDTH }}>
        {/* Línea de "ahora" */}
        <div
          className="pointer-events-none absolute top-0 bottom-0 z-20 w-0.5 bg-red-600"
          style={{ left: nowLeft }}
        />

        {/* Regla de horario */}
        <div className="sticky top-0 z-20 flex h-14 items-center border-b border-white/10 bg-[#0e0b0b]/80 backdrop-blur-[2px]">
          <div className="sticky left-0 z-10 flex shrink-0 items-center justify-center" style={{ width: LEFT_COL_WIDTH, height: '100%' }}>
            <span className="rounded-full bg-red-600 px-4 py-1.5 text-xs font-bold text-white tracking-wide">
              HOY
            </span>
          </div>
          <div className="relative h-full shrink-0" style={{ width: TIMELINE_WIDTH }}>
            {columns.map((col) => (
              <span
                key={col.label + col.left}
                className="absolute top-0 bottom-0 flex items-start justify-center pt-2 border-l border-white/10 pl-2 text-[11px] font-medium whitespace-nowrap text-white/50"
                style={{ left: col.left }}
              >
                {col.label}
              </span>
            ))}
          </div>
        </div>

        {/* Filas de canales */}
        {guide.map(({ channel, programs }) => (
          <div key={channel.id} className="flex border-b border-white/5 last:border-b-0" style={{ height: ROW_HEIGHT }}>
            <Link
              href={`/canales/${channel.slug}`}
              className="sticky left-0 z-10 flex shrink-0 items-center justify-center p-3"
              style={{ width: LEFT_COL_WIDTH }}
            >
              <div
                className={cn(
                  'flex h-full w-full items-center justify-center overflow-hidden rounded-lg',
                  !channel.logoUrl && `bg-gradient-to-br ${gradientFor(channel.id)}`,
                )}
              >
                {channel.logoUrl ? (
                  <div className="flex h-full w-full items-center justify-center bg-[#0e0b0b]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={channel.logoUrl} alt={channel.name} className="max-h-[70%] max-w-[80%] object-contain" />
                  </div>
                ) : (
                  <span className="line-clamp-3 px-1 text-center text-[10px] leading-tight font-bold text-white">
                    {channel.name}
                  </span>
                )}
              </div>
            </Link>

            <div className="relative shrink-0" style={{ width: TIMELINE_WIDTH }}>
              {programs.map((program) => {
                const startMin = Math.max(0, minutesSince(dayStart, program.startTime));
                const endMin = Math.min(DAY_MINUTES, minutesSince(dayStart, program.endTime));
                const isLive = now >= new Date(program.startTime).getTime() && now < new Date(program.endTime).getTime();
                if (endMin <= startMin) return null;
                return (
                  <div
                    key={program.id}
                    className={cn(
                      'absolute inset-y-1.5 overflow-hidden border-r border-white/10 px-4 py-2.5',
                      isLive ? 'z-10 rounded-lg bg-red-600/10 ring-2 ring-red-600' : 'hover:bg-white/5',
                    )}
                    style={{ left: startMin * PX_PER_MIN, width: (endMin - startMin) * PX_PER_MIN }}
                  >
                    <p className="flex items-center gap-2 truncate text-sm font-semibold text-white">
                      {isLive && (
                        <span className="shrink-0 rounded bg-red-600 px-2 py-0.5 text-[10px] font-bold tracking-wide text-white">
                          EN VIVO
                        </span>
                      )}
                      <span className="truncate">{program.title}</span>
                    </p>
                    <p className="mt-1 truncate text-xs text-white/45">{formatRange(program.startTime, program.endTime)}</p>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
