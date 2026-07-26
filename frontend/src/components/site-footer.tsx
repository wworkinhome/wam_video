import Link from 'next/link';
import { SiteLogo } from './site-logo';

const FOOTER_LINKS = [
  { href: '/peliculas', label: 'Películas' },
  { href: '/series', label: 'Series' },
  { href: '/canales', label: 'TV en Vivo' },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-black px-4 py-10 sm:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 text-sm text-white/50">
        <SiteLogo className="h-8" />
        <nav className="flex flex-wrap gap-x-6 gap-y-2">
          {FOOTER_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="transition-colors hover:text-white">
              {link.label}
            </Link>
          ))}
        </nav>
        <p>© {new Date().getFullYear()} WAMVIDEO. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
}
