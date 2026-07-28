'use client';

import { useState } from 'react';
import { Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { HlsLevel } from '@/hooks/use-hls-player';

function levelLabel(level: HlsLevel) {
  return `${level.height}p`;
}

export function QualityMenu({
  levels,
  currentLevel,
  onSelect,
  className,
}: {
  levels: HlsLevel[];
  currentLevel: number;
  onSelect: (index: number) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  if (levels.length < 2) return null;

  const sorted = [...levels].sort((a, b) => b.height - a.height);
  const activeLabel = currentLevel === -1 ? 'Automática' : (levels.find((l) => l.index === currentLevel)?.height ?? '') + 'p';

  return (
    <div className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Calidad de video"
        className="flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-2 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/70"
      >
        <Settings className="size-4" />
        <span className="hidden sm:inline">{activeLabel}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full right-0 z-20 mt-2 w-36 overflow-hidden rounded-lg bg-black/90 py-1 text-sm shadow-xl backdrop-blur-sm">
            <button
              type="button"
              onClick={() => {
                onSelect(-1);
                setOpen(false);
              }}
              className={cn(
                'block w-full px-3 py-2 text-left text-white/80 hover:bg-white/10 hover:text-white',
                currentLevel === -1 && 'font-semibold text-red-500',
              )}
            >
              Automática
            </button>
            {sorted.map((level) => (
              <button
                key={level.index}
                type="button"
                onClick={() => {
                  onSelect(level.index);
                  setOpen(false);
                }}
                className={cn(
                  'block w-full px-3 py-2 text-left text-white/80 hover:bg-white/10 hover:text-white',
                  currentLevel === level.index && 'font-semibold text-red-500',
                )}
              >
                {levelLabel(level)}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
