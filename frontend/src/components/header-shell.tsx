'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Menu, Search, User, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogoutButton } from './logout-button';
import { SiteLogo } from './site-logo';
import { hasPermission } from '@/lib/auth/permissions';
import type { CurrentUser } from '@/lib/api/types';

const NAV_LINKS = [
  { href: '/', label: 'Inicio' },
  { href: '/guia', label: 'Guía de TV' },
  { href: '/peliculas', label: 'Películas' },
  { href: '/series', label: 'Series' },
  { href: '/canales', label: 'TV en Vivo' },
  { href: '/deportes', label: 'Deportes' },
  { href: '/noticias', label: 'Noticias' },
  { href: '/musica', label: 'Música' },
  { href: '/kids', label: 'Kids' },
  { href: '/internacional', label: 'Internacional' },
];

function isLinkActive(href: string, pathname: string, category: string | null) {
  const [linkPath, linkQuery] = href.split('?');
  const linkCategory = linkQuery ? new URLSearchParams(linkQuery).get('category') : null;
  return linkPath === '/' ? pathname === '/' : pathname.startsWith(linkPath) && category === linkCategory;
}

function SearchForm({ onSubmitted, className }: { onSubmitted?: () => void; className?: string }) {
  const router = useRouter();
  const [value, setValue] = useState('');

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const q = value.trim();
    if (!q) return;
    router.push(`/buscar?q=${encodeURIComponent(q)}`);
    onSubmitted?.();
  }

  return (
    <form onSubmit={handleSubmit} className={cn('relative', className)}>
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-white/40" />
      <input
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Buscar películas, series, canales…"
        className="h-9 w-full rounded-full border border-white/15 bg-black/40 pl-9 pr-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-red-600/60"
      />
    </form>
  );
}

export function HeaderShell({ user }: { user: CurrentUser | null }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const category = searchParams.get('category');

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 40);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (!searchOpen) return;
    function onClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [searchOpen]);

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-colors duration-300',
        mobileOpen || scrolled
          ? 'bg-black shadow-lg shadow-black/40'
          : 'bg-gradient-to-b from-black/90 via-black/50 to-transparent',
      )}
    >
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-6">
          <Link href="/" className="shrink-0">
            <SiteLogo className="h-10 sm:h-11" />
          </Link>
          <nav className="hidden min-w-0 items-center gap-4 text-[13px] font-semibold xl:flex 2xl:gap-5 2xl:text-sm">
            {NAV_LINKS.map((link) => {
              const active = isLinkActive(link.href, pathname, category);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'relative shrink-0 py-1 whitespace-nowrap transition-colors',
                    active ? 'text-white' : 'text-white/70 hover:text-white',
                  )}
                >
                  {link.label}
                  {active && <span className="absolute inset-x-0 -bottom-1.5 h-0.5 rounded-full bg-red-600" />}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div ref={searchRef} className="hidden items-center xl:flex">
            {searchOpen ? (
              <SearchForm className="w-64" onSubmitted={() => setSearchOpen(false)} />
            ) : (
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="flex size-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                aria-label="Buscar"
              >
                <Search className="size-4" />
              </button>
            )}
          </div>

          <div className="hidden items-center gap-3 xl:flex">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <button
                      className="flex size-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                      aria-label="Cuenta"
                    />
                  }
                >
                  <User className="size-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>{user.name}</DropdownMenuLabel>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem render={<Link href="/perfiles" />}>Perfiles</DropdownMenuItem>
                  <DropdownMenuItem render={<Link href="/continuar-viendo" />}>Mi lista</DropdownMenuItem>
                  <DropdownMenuItem render={<Link href="/watch-party" />}>Watch Party</DropdownMenuItem>
                  {hasPermission(user, 'channels.manage') && (
                    <DropdownMenuItem render={<Link href="/admin/canales" />}>Admin</DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <LogoutButton className="w-full justify-start rounded-md px-1.5 text-sm font-normal text-destructive hover:bg-destructive/10" />
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link href="/login">
                  <Button size="sm" variant="ghost" className="text-white/80 hover:bg-white/10 hover:text-white">
                    Iniciar sesión
                  </Button>
                </Link>
                <Link href="/registro">
                  <Button size="sm">Registrarse</Button>
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            className="flex size-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 xl:hidden"
            aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="h-[calc(100dvh-64px)] overflow-y-auto bg-black xl:hidden">
          <div className="px-4 pt-3">
            <SearchForm />
          </div>
          <nav className="flex flex-col px-4 py-2">
            {NAV_LINKS.map((link) => {
              const active = isLinkActive(link.href, pathname, category);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'border-b border-white/5 py-3.5 text-base font-semibold',
                    active ? 'text-red-500' : 'text-white/85',
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex flex-col gap-3 border-t border-white/10 px-4 py-5">
            {user ? (
              <>
                <p className="px-1 text-sm text-white/50">{user.name}</p>
                <Link href="/perfiles" className="py-2 text-base font-medium text-white/85">
                  Perfiles
                </Link>
                <Link href="/continuar-viendo" className="py-2 text-base font-medium text-white/85">
                  Mi lista
                </Link>
                <Link href="/watch-party" className="py-2 text-base font-medium text-white/85">
                  Watch Party
                </Link>
                {hasPermission(user, 'channels.manage') && (
                  <Link href="/admin/canales" className="py-2 text-base font-medium text-white/85">
                    Admin
                  </Link>
                )}
                <LogoutButton className="mt-2 w-full justify-center text-destructive" />
              </>
            ) : (
              <>
                <Link href="/registro">
                  <Button className="w-full">Registrarse</Button>
                </Link>
                <Link href="/login">
                  <Button variant="ghost" className="w-full text-white/80">
                    Iniciar sesión
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
