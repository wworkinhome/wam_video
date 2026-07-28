'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Users } from 'lucide-react';
import { clientFetch } from '@/lib/api/client';
import type { WatchParty } from '@/lib/api/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export default function WatchPartyPage() {
  const router = useRouter();
  const [movieId, setMovieId] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [created, setCreated] = useState<WatchParty | null>(null);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    if (!movieId.trim()) return;
    setCreating(true);
    try {
      const party = await clientFetch<WatchParty>('/watch-parties', {
        method: 'POST',
        body: JSON.stringify({ movieId: movieId.trim() }),
      });
      setCreated(party);
      toast.success(`Watch party creado — código ${party.code}`);
    } catch {
      toast.error('No se pudo crear el watch party (¿el ID de película es válido?)');
    } finally {
      setCreating(false);
    }
  }

  async function handleJoin(event: React.FormEvent) {
    event.preventDefault();
    if (!joinCode.trim()) return;
    setJoining(true);
    try {
      const party = await clientFetch<WatchParty>(`/watch-parties/code/${joinCode.trim().toUpperCase()}`);
      await clientFetch(`/watch-parties/${party.id}/join`, { method: 'POST' });
      toast.success('Te uniste al watch party');
      router.push(`/watch-party/${party.id}`);
    } catch {
      toast.error('Código inválido');
    } finally {
      setJoining(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-full bg-red-600/15 text-red-500">
          <Users className="size-5" />
        </div>
        <h1 className="text-2xl font-bold text-white">Watch Party</h1>
      </div>
      <p className="text-sm text-white/60">
        Mirá contenido junto a otros usando un código para unirse, con chat en vivo. La
        reproducción todavía no se sincroniza automáticamente entre participantes — cada quien
        controla la suya.
      </p>

      <Card className="border-none bg-white/[0.04] ring-1 ring-white/10">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-white">Crear</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="movieId">ID de película</Label>
              <Input
                id="movieId"
                value={movieId}
                onChange={(event) => setMovieId(event.target.value)}
                placeholder="uuid de la película"
              />
            </div>
            <Button type="submit" disabled={creating}>
              {creating ? 'Creando…' : 'Crear watch party'}
            </Button>
          </form>
          {created && (
            <div className="mt-3 flex flex-col gap-2">
              <p className="text-sm text-white/70">
                Código para compartir:{' '}
                <span className="rounded bg-red-600/15 px-1.5 py-0.5 font-mono font-semibold text-red-400">
                  {created.code}
                </span>
              </p>
              <Button
                type="button"
                onClick={() => router.push(`/watch-party/${created.id}`)}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                Entrar a la sala
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-none bg-white/[0.04] ring-1 ring-white/10">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-white">Unirse con código</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleJoin} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="code">Código</Label>
              <Input
                id="code"
                value={joinCode}
                onChange={(event) => setJoinCode(event.target.value)}
                placeholder="ABC123"
              />
            </div>
            <Button type="submit" disabled={joining}>
              {joining ? 'Uniendo…' : 'Unirme'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
