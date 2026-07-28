import Link from 'next/link';
import { SiteLogo } from './site-logo';

const FOOTER_LINKS = [
  { href: '/peliculas', label: 'Películas' },
  { href: '/series', label: 'Series' },
  { href: '/canales', label: 'TV en Vivo' },
];

export function SiteFooter() {
  return (
    <footer className="bg-gradient-to-b from-[#1c1717] to-transparent border-t border-white/10 px-4 py-10 sm:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 text-sm text-white/50">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-6">
            <SiteLogo className="h-8" />
            <nav className="flex flex-wrap gap-x-6 gap-y-2">
              {[
                { href: '/peliculas', label: 'Películas' },
                { href: '/series', label: 'Series' },
                { href: '/canales', label: 'TV en Vivo' },
              ].map((link) => (
                <Link key={link.href} href={link.href} className="transition-colors hover:text-white">
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-xs">© {new Date().getFullYear()} WAMVIDEO. Todos los derechos reservados.</span>
            <div className="flex gap-6 text-xs">
              <Link href="/privacy" className="transition-colors hover:text-white">Política de Privacidad</Link>
              <Link href="/faq" className="transition-colors hover:text-white">Preguntas Frecuentes</Link>
              <Link href="/contact" className="transition-colors hover:text-white">Contáctanos</Link>
              <Link href="/terms" className="transition-colors hover:text-white">Términos del Servicio</Link>
              <Link href="/about" className="transition-colors hover:text-white">Acerca de</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
