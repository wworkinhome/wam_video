'use client';

import { useRef, useState } from 'react';
import { cn } from '@/lib/utils';

const LENGTH = 4;

export function PinInput({
  onComplete,
  error,
  disabled,
}: {
  onComplete: (pin: string) => void;
  error?: boolean;
  disabled?: boolean;
}) {
  const [digits, setDigits] = useState<string[]>(Array(LENGTH).fill(''));
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  function setDigit(index: number, value: string) {
    const clean = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = clean;
    setDigits(next);

    if (clean && index < LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
    if (next.every((d) => d !== '')) {
      onComplete(next.join(''));
    }
  }

  function handleKeyDown(index: number, event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  }

  return (
    <div className="flex gap-3">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputsRef.current[index] = el;
          }}
          type="password"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          disabled={disabled}
          onChange={(event) => setDigit(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          className={cn(
            'h-14 w-12 rounded-md border bg-black/40 text-center text-2xl font-semibold text-white outline-none sm:h-16 sm:w-14',
            error ? 'border-red-600' : 'border-white/25 focus:border-white',
          )}
        />
      ))}
    </div>
  );
}
