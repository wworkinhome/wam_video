'use client';

import { AVATAR_PRESETS, avatarDataUri } from '@/lib/profile-avatars';
import { cn } from '@/lib/utils';

export function AvatarPicker({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  return (
    <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
      {AVATAR_PRESETS.map((preset) => {
        const url = avatarDataUri(preset);
        const selected = value === url;
        return (
          <button
            key={preset.id}
            type="button"
            onClick={() => onChange(url)}
            aria-label={`Avatar ${preset.id}`}
            className={cn(
              'flex aspect-square items-center justify-center overflow-hidden rounded-lg ring-2 ring-transparent transition-all hover:scale-105',
              selected && 'ring-red-600',
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="h-full w-full object-cover" />
          </button>
        );
      })}
    </div>
  );
}
