import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export function MediaRow({
  title,
  href,
  children,
}: {
  title: string;
  href?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold text-white sm:text-xl">{title}</h2>
        {href && (
          <Link
            href={href}
            className="flex items-center gap-0.5 text-sm font-medium text-white/60 transition-colors hover:text-red-500"
          >
            Más
            <ChevronRight className="size-4" />
          </Link>
        )}
      </div>
      <div className="flex gap-2 overflow-x-auto pb-4 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-track]:bg-transparent">
        {children}
      </div>
    </section>
  );
}
