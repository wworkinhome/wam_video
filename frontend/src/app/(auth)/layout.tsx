import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-black px-4 py-10">
      <Link href="/" className="mb-6 text-2xl font-bold tracking-tight text-red-600">
        WAMVIDEO
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </main>
  );
}
