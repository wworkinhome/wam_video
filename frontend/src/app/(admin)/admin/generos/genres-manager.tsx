'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
import { clientFetch } from '@/lib/api/client';
import type { Genre } from '@/lib/api/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useConfirmDialog } from '@/components/confirm-dialog';

const DIACRITICS_REGEX = new RegExp('[̀-ͯ]', 'g');

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(DIACRITICS_REGEX, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function GenresManager({ tenantId, genres }: { tenantId: string; genres: Genre[] }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const { confirm, ConfirmDialog } = useConfirmDialog();

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setCreating(true);
    try {
      await clientFetch('/genres', {
        method: 'POST',
        body: JSON.stringify({ tenantId, name, slug: slugify(name) }),
      });
      toast.success('Género creado');
      setName('');
      router.refresh();
    } catch {
      toast.error('No se pudo crear el género (¿ya existe ese slug?)');
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string, label: string) {
    const ok = await confirm({ title: `¿Eliminar "${label}"?`, confirmLabel: 'Eliminar', destructive: true });
    if (!ok) return;
    try {
      await clientFetch(`/genres/${id}`, { method: 'DELETE' });
      toast.success('Género eliminado');
      router.refresh();
    } catch {
      toast.error('No se pudo eliminar (puede estar en uso por alguna película o serie)');
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {genres.length === 0 ? (
        <p className="text-white/60">Todavía no hay géneros.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {genres.map((genre) => (
            <span
              key={genre.id}
              className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 py-1 pr-1.5 pl-3 text-sm text-white"
            >
              {genre.name}
              <button
                type="button"
                onClick={() => handleDelete(genre.id, genre.name)}
                aria-label={`Eliminar ${genre.name}`}
                className="flex size-5 items-center justify-center rounded-full text-white/40 transition-colors hover:bg-destructive/20 hover:text-destructive"
              >
                <Trash2 className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <form onSubmit={handleCreate} className="flex items-end gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="genre-name">Nuevo género</Label>
          <Input
            id="genre-name"
            required
            minLength={2}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Acción, Comedia, Anime…"
          />
        </div>
        <Button type="submit" disabled={creating || name.trim().length < 2} className="gap-1.5 bg-red-600 text-white hover:bg-red-700">
          <Plus className="size-4" />
          Agregar
        </Button>
      </form>
      {ConfirmDialog}
    </div>
  );
}
