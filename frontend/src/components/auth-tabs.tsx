'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const TABS = [
  { href: '/login', label: 'Ingresar' },
  { href: '/registro', label: 'Crear cuenta' },
];

export function AuthTabs() {
  const pathname = usePathname();

  return (
    <div className="flex gap-1 rounded-full bg-white/5 p-1">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'flex-1 rounded-full px-3 py-2 text-center text-xs font-bold tracking-wide uppercase transition-colors',
              active ? 'bg-red-600 text-white' : 'text-white/50 hover:text-white',
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
