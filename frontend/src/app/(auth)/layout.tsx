import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { AuthTabs } from '@/components/auth-tabs';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative flex min-h-screen flex-1 items-center overflow-hidden bg-black px-4 py-10 sm:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(220,38,38,0.18),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:36px_36px]" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo_definitivo_transparent.png"
        alt=""
        className="animate-pulse-glow pointer-events-none absolute top-1/2 right-[-12%] w-[720px] max-w-none -translate-y-1/2 opacity-[0.16] sm:right-[-6%] lg:right-[4%]"
      />

      <Link
        href="/"
        className="absolute top-4 left-4 z-10 flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/60 transition-colors hover:bg-white/10 hover:text-white sm:top-6 sm:left-8"
      >
        <ArrowLeft className="size-3.5" />
        Volver al inicio
      </Link>

      <div className="relative z-10 mx-auto grid w-full max-w-5xl items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="hidden flex-col lg:flex">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo_definitivo_transparent.png" alt="WAM Video" className="animate-pulse-glow w-56" />
          <p className="-mt-2 max-w-sm text-sm text-white/60">
            Acceso a películas, series y canales en vivo 24/7, todo en un solo lugar.
          </p>
        </div>

        <div className="mx-auto w-full max-w-sm">
          <div className="mb-4 flex justify-center lg:hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo_definitivo_transparent.png" alt="WAM Video" className="animate-pulse-glow w-40" />
          </div>
          <AuthTabs />
          <div className="mt-4">{children}</div>
        </div>
      </div>
    </main>
  );
}
