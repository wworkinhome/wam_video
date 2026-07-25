import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { Button } from '@/components/ui/button';
import { LogoutButton } from './logout-button';

export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="text-lg font-semibold">
          WAMVIDEO
        </Link>
        <nav className="flex flex-wrap items-center gap-4 text-sm">
          <Link href="/peliculas" className="hover:underline">
            Películas
          </Link>
          <Link href="/series" className="hover:underline">
            Series
          </Link>
          {user ? (
            <>
              <Link href="/perfiles" className="hover:underline">
                Perfiles
              </Link>
              <Link href="/favoritos" className="hover:underline">
                Favoritos
              </Link>
              <Link href="/continuar-viendo" className="hover:underline">
                Continuar viendo
              </Link>
              <Link href="/watch-party" className="hover:underline">
                Watch Party
              </Link>
              <span className="text-muted-foreground">{user.name}</span>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login">
                <Button size="sm" variant="outline">
                  Iniciar sesión
                </Button>
              </Link>
              <Link href="/registro">
                <Button size="sm">Registrarse</Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
