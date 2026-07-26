'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import { clientFetch } from '@/lib/api/client';
import { Button } from '@/components/ui/button';

export function DeleteSeriesButton({ id, title }: { id: string; title: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm(`¿Eliminar la serie "${title}" y todo su contenido (temporadas/episodios)? Esta acción no se puede deshacer.`)) return;
    setDeleting(true);
    try {
      await clientFetch(`/series/${id}`, { method: 'DELETE' });
      toast.success('Serie eliminada');
      router.refresh();
    } catch {
      toast.error('No se pudo eliminar la serie');
    } finally {
      setDeleting(false);
    }
  }

  return (
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
  );
}
