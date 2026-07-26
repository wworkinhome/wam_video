'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const TABS = [
  { href: '/admin', label: 'Dashboard', exact: true },
  { href: '/admin/usuarios', label: 'Usuarios', exact: false },
  { href: '/admin/canales', label: 'Canales', exact: false },
  { href: '/admin/peliculas', label: 'Películas', exact: false },
  { href: '/admin/series', label: 'Series', exact: false },
  { href: '/admin/generos', label: 'Géneros', exact: false },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <div className="relative border-b border-white/10 bg-black/40">
      <div className="mx-auto flex max-w-6xl gap-1 px-4 sm:px-8">
        {TABS.map((tab) => {
          const active = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'relative px-3 py-3 text-sm font-semibold transition-colors',
                active ? 'text-white' : 'text-white/50 hover:text-white',
              )}
            >
              {tab.label}
              {active && <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-red-600" />}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
