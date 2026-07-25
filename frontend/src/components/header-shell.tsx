'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { LogoutButton } from './logout-button';
import { hasPermission } from '@/lib/auth/permissions';
import type { CurrentUser } from '@/lib/api/types';

export function HeaderShell({ user }: { user: CurrentUser | null }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 40);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-colors duration-300',
        scrolled ? 'bg-black shadow-lg' : 'bg-gradient-to-b from-black/85 via-black/40 to-transparent',
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-8">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-2xl font-bold tracking-tight text-red-600">
            WAMVIDEO
          </Link>
          <nav className="hidden items-center gap-5 text-sm font-medium text-white/80 sm:flex">
            <Link href="/" className="transition-colors hover:text-white">
              Inicio
            </Link>
            <Link href="/peliculas" className="transition-colors hover:text-white">
              Películas
            </Link>
            <Link href="/series" className="transition-colors hover:text-white">
              Series
            </Link>
            <Link href="/canales" className="transition-colors hover:text-white">
              TV en Vivo
            </Link>
            <Link href="/canales?category=Deportes" className="transition-colors hover:text-white">
              Deportes
            </Link>
            <Link href="/canales?category=Noticias" className="transition-colors hover:text-white">
              Noticias
            </Link>
            <Link href="/canales?category=Música" className="transition-colors hover:text-white">
              Música
            </Link>
            <Link href="/canales?category=Kids" className="transition-colors hover:text-white">
              Kids
            </Link>
            {user && (
              <>
                <Link href="/continuar-viendo" className="transition-colors hover:text-white">
                  Mi lista
                </Link>
                <Link href="/watch-party" className="transition-colors hover:text-white">
                  Watch Party
                </Link>
                {hasPermission(user, 'channels.manage') && (
                  <Link href="/admin/canales" className="transition-colors hover:text-white">
                    Admin
                  </Link>
                )}
              </>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link href="/perfiles" className="text-sm text-white/80 transition-colors hover:text-white">
                {user.name}
              </Link>
              <LogoutButton className="text-white/80 hover:bg-white/10 hover:text-white" />
            </>
          ) : (
            <>
              <Link href="/login">
                <Button size="sm" variant="ghost" className="text-white/80 hover:bg-white/10 hover:text-white">
                  Iniciar sesión
                </Button>
              </Link>
              <Link href="/registro">
                <Button size="sm" className="bg-red-600 text-white hover:bg-red-700">
                  Registrarse
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
