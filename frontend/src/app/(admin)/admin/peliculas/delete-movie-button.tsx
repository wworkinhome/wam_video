'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import { clientFetch } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { useConfirmDialog } from '@/components/confirm-dialog';

export function DeleteMovieButton({ id, title }: { id: string; title: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const { confirm, ConfirmDialog } = useConfirmDialog();

  async function handleDelete() {
    const ok = await confirm({
      title: `¿Eliminar "${title}"?`,
      description: 'Esta acción no se puede deshacer.',
      confirmLabel: 'Eliminar',
      destructive: true,
    });
    if (!ok) return;
    setDeleting(true);
    try {
      await clientFetch(`/movies/${id}`, { method: 'DELETE' });
      toast.success('Película eliminada');
      router.refresh();
    } catch {
      toast.error('No se pudo eliminar la película');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        disabled={deleting}
        onClick={handleDelete}
        className="text-white/50 hover:bg-destructive/10 hover:text-destructive"
        aria-label={`Eliminar ${title}`}
      >
        <Trash2 className="size-4" />
      </Button>
      {ConfirmDialog}
    </>
  );
}
