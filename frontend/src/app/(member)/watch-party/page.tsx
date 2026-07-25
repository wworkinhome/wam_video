'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
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
      if (party.movieId) {
        router.push(`/ver/pelicula/${party.movieId}`);
      } else if (party.episodeId) {
        router.push(`/ver/episodio/${party.episodeId}`);
      }
    } catch {
      toast.error('Código inválido');
    } finally {
      setJoining(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <h1 className="text-2xl font-bold">Watch Party</h1>
      <p className="text-sm text-muted-foreground">
        Mirá contenido junto a otros usando un código para unirse. La reproducción todavía no se
        sincroniza en vivo entre participantes.
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Crear</CardTitle>
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
            <p className="mt-3 text-sm">
              Código para compartir: <span className="font-mono font-semibold">{created.code}</span>
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Unirse con código</CardTitle>
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
