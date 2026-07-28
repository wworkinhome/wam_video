'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Bell, Clapperboard, Film, Loader2, Lock, Menu, Search, Tv, User, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { gradientFor } from '@/lib/gradient';
import { clientFetch } from '@/lib/api/client';
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
import { useProfiles } from '@/hooks/use-profiles';
import { useNotifications } from '@/hooks/use-notifications';
import { selectActiveProfile } from '@/lib/auth/active-profile-actions';
import { ACTIVE_PROFILE_COOKIE } from '@/lib/constants';
import type { CurrentUser, Profile, Paginated, Movie, Series, Channel } from '@/lib/api/types';

const SEARCH_DEBOUNCE_MS = 250;
const SEARCH_MIN_CHARS = 2;

interface QuickResults {
  movies: Movie[];
  series: Series[];
  channels: Channel[];
}

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

function ResultThumb({ id, imageUrl, icon: Icon }: { id: string; imageUrl: string | null; icon: React.ElementType }) {
  return (
    <span
      className={cn(
        'flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-[#0e0b0b]',
        !imageUrl && `bg-gradient-to-br ${gradientFor(id)}`,
      )}
    >
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <Icon className="size-4 text-white/80" />
      )}
    </span>
  );
}

function SearchForm({ onSubmitted, className }: { onSubmitted?: () => void; className?: string }) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState('');
  const [results, setResults] = useState<QuickResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const q = value.trim();
    if (q.length < SEARCH_MIN_CHARS) {
      setResults(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const timeout = setTimeout(async () => {
      try {
        const [movies, series, channels] = await Promise.all([
          clientFetch<Paginated<Movie>>(`/movies?q=${encodeURIComponent(q)}&limit=4`),
          clientFetch<Paginated<Series>>(`/series?q=${encodeURIComponent(q)}&limit=4`),
          clientFetch<Paginated<Channel>>(`/channels?q=${encodeURIComponent(q)}&limit=4`),
        ]);
        setResults({ movies: movies.data, series: series.data, channels: channels.data });
        setOpen(true);
      } catch {
        setResults(null);
      } finally {
        setLoading(false);
      }
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [value]);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  function goToResults() {
    const q = value.trim();
    if (!q) return;
    setOpen(false);
    router.push(`/buscar?q=${encodeURIComponent(q)}`);
    onSubmitted?.();
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    goToResults();
  }

  function handlePickResult() {
    setOpen(false);
    onSubmitted?.();
  }

  const hasQuery = value.trim().length >= SEARCH_MIN_CHARS;
  const hasResults = !!results && results.movies.length + results.series.length + results.channels.length > 0;

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <form onSubmit={handleSubmit} className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-white/40" />
        <input
          type="search"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setOpen(true);
          }}
          onFocus={() => hasQuery && setOpen(true)}
          placeholder="Buscar películas, series, canales…"
          className="h-9 w-full rounded-full border border-white/15 bg-[#0e0b0b]/40 pl-9 pr-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-red-500/60"
        />
      </form>

      {open && hasQuery && (
        <div className="glass-surface absolute top-full left-0 z-10 mt-2 max-h-[70vh] w-full min-w-72 overflow-y-auto rounded-xl ring-1 ring-white/10 sm:w-96">
          {loading && !results ? (
            <div className="flex items-center gap-2 px-4 py-4 text-sm text-white/50">
              <Loader2 className="size-4 animate-spin" />
              Buscando…
            </div>
          ) : !hasResults ? (
            <p className="px-4 py-4 text-sm text-white/50">Sin resultados para &quot;{value.trim()}&quot;.</p>
          ) : (
            <div className="flex flex-col py-1.5">
              {results!.channels.map((channel) => (
                <Link
                  key={channel.id}
                  href={`/canales/${channel.slug}`}
                  onClick={handlePickResult}
                  className="flex items-center gap-3 px-4 py-2 transition-colors hover:bg-white/10"
                >
                  <ResultThumb id={channel.id} imageUrl={channel.logoUrl} icon={Tv} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-white">{channel.name}</span>
                    <span className="text-xs text-white/40">Canal en vivo</span>
                  </span>
                </Link>
              ))}
              {results!.movies.map((movie) => (
                <Link
                  key={movie.id}
                  href={`/peliculas/${movie.slug}`}
                  onClick={handlePickResult}
                  className="flex items-center gap-3 px-4 py-2 transition-colors hover:bg-white/10"
                >
                  <ResultThumb id={movie.id} imageUrl={movie.posterUrl} icon={Film} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-white">{movie.title}</span>
                    <span className="text-xs text-white/40">Película</span>
                  </span>
                </Link>
              ))}
              {results!.series.map((series) => (
                <Link
                  key={series.id}
                  href={`/series/${series.slug}`}
                  onClick={handlePickResult}
                  className="flex items-center gap-3 px-4 py-2 transition-colors hover:bg-white/10"
                >
                  <ResultThumb id={series.id} imageUrl={series.posterUrl} icon={Clapperboard} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-white">{series.title}</span>
                    <span className="text-xs text-white/40">Serie</span>
                  </span>
                </Link>
              ))}
              <button
                type="button"
                onClick={goToResults}
                className="mt-1 border-t border-white/10 px-4 py-2.5 text-left text-sm font-medium text-red-500 transition-colors hover:bg-white/10"
              >
                Ver todos los resultados para &quot;{value.trim()}&quot;
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function HeaderShell({ user }: { user: CurrentUser | null }) {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const category = searchParams.get('category');
  const { data: profiles } = useProfiles(!!user);
  const { data: notificationsData } = useNotifications();
  const unreadCount = notificationsData?.data.filter((n) => !n.readAt).length ?? 0;

  useEffect(() => {
    const match = document.cookie.match(new RegExp(`(?:^|; )${ACTIVE_PROFILE_COOKIE}=([^;]+)`));
    setActiveProfileId(match ? decodeURIComponent(match[1]) : null);
  }, [pathname]);

  async function handleSwitchProfile(profile: Profile) {
    if (profile.hasPin && profile.id !== activeProfileId) {
      router.push('/perfiles');
      return;
    }
    await selectActiveProfile(profile.id);
    setActiveProfileId(profile.id);
    router.refresh();
  }

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
          ? 'bg-[#0e0b0b]/95 backdrop-blur-md shadow-lg shadow-black/40'
          : 'bg-gradient-to-b from-[#0e0b0b]/90 via-[#0e0b0b]/40 to-transparent',
      )}
    >
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-6">
          <Link href="/" className="shrink-0">
            <SiteLogo className="h-[68px] sm:h-[86px]" />
          </Link>
          <nav className="hidden min-w-0 items-center gap-5 text-sm font-semibold xl:flex 2xl:gap-6 2xl:text-base">
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
                  {active && <span className="absolute inset-x-0 -bottom-1.5 h-0.5 rounded-full bg-gradient-to-r from-red-500 to-red-700" />}
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
            {user && (
              <Link href="/notificaciones" className="relative flex size-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20" aria-label="Notificaciones">
                <Bell className="size-4" />
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </Link>
            )}
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
                  {profiles && profiles.length > 1 && (
                    <>
                      <DropdownMenuGroup>
                        {profiles.map((profile) => (
                          <DropdownMenuItem
                            key={profile.id}
                            className="gap-2"
                            onClick={() => handleSwitchProfile(profile)}
                          >
                            <span
                              className={cn(
                                'flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-md',
                                !profile.avatarUrl && `bg-gradient-to-br ${gradientFor(profile.id)}`,
                              )}
                            >
                              {profile.avatarUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={profile.avatarUrl} alt="" className="h-full w-full object-cover" />
                              ) : (
                                <User className="size-3.5 text-white/90" />
                              )}
                            </span>
                            <span className="flex-1 truncate">{profile.name}</span>
                            {profile.hasPin && <Lock className="size-3.5 text-white/40" />}
                            {profile.id === activeProfileId && <span className="size-1.5 shrink-0 rounded-full bg-red-500" />}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuGroup>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem render={<Link href="/perfiles" />}>Perfiles</DropdownMenuItem>
                  <DropdownMenuItem render={<Link href="/continuar-viendo" />}>Mi lista</DropdownMenuItem>
                  <DropdownMenuItem render={<Link href="/watch-party" />}>Watch Party</DropdownMenuItem>
                  <DropdownMenuItem render={<Link href="/cuenta/plan" />}>Mi plan</DropdownMenuItem>
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
        <div className="h-[calc(100dvh-64px)] overflow-y-auto bg-[#0e0b0b] xl:hidden">
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
                <Link href="/notificaciones" className="flex items-center gap-2 py-2 text-base font-medium text-white/85">
                  <Bell className="size-4" />
                  Notificaciones
                  {unreadCount > 0 && (
                    <span className="ml-auto flex size-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
                      {unreadCount}
                    </span>
                  )}
                </Link>
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
                <Link href="/cuenta/plan" className="py-2 text-base font-medium text-white/85">
                  Mi plan
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
