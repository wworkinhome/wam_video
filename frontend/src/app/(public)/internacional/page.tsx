import Link from 'next/link';
import { COUNTRIES, flagUrl } from '@/lib/countries';

export const metadata = {
  title: 'Internacional | WAMVIDEO',
};

export default function InternacionalPage() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-10 sm:px-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Internacional</h1>
        <p className="mt-1 text-sm text-white/60">Elige un país para ver su TV en vivo.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {COUNTRIES.map((country) => (
          <Link
            key={country.code}
            href={`/canales?country=${country.code}`}
            className="group flex flex-col items-center gap-2 rounded-xl bg-white/5 px-3 py-6 text-center ring-1 ring-white/10 transition-all hover:bg-white/10 hover:ring-red-600/60"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={flagUrl(country.code)}
              alt=""
              className="h-10 w-14 rounded object-cover ring-1 ring-white/10"
            />
            <span className="text-sm font-medium text-white/85 group-hover:text-white">{country.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
