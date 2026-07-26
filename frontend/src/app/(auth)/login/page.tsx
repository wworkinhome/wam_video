'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { LogIn, Mail, Lock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        toast.error('Credenciales inválidas');
        return;
      }
      router.push('/perfiles');
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/60">
      <h1 className="text-center text-lg font-black tracking-tight text-white uppercase">Bienvenido de nuevo</h1>
      <p className="mt-1 text-center text-xs text-white/50 uppercase tracking-wide">Accedé a la plataforma</p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-[11px] font-bold tracking-wide text-white/60 uppercase">
            Correo electrónico
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-white/40" />
            <Input
              id="email"
              type="email"
              required
              placeholder="tu@correo.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-11 pl-9"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-[11px] font-bold tracking-wide text-white/60 uppercase">
              Contraseña
            </label>
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-white/40" />
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-11 pl-9"
            />
          </div>
        </div>

        <Button type="submit" disabled={loading} size="lg" className="mt-2 gap-2">
          <LogIn className="size-4" />
          {loading ? 'Ingresando…' : 'Iniciar sesión'}
        </Button>
      </form>
    </div>
  );
}
