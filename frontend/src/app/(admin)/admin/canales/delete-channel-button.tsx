'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import { clientFetch } from '@/lib/api/client';
import { Button } from '@/components/ui/button';

export function DeleteChannelButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm(`¿Eliminar el canal "${name}"? Esta acción no se puede deshacer.`)) return;
    setDeleting(true);
    try {
      await clientFetch(`/channels/${id}`, { method: 'DELETE' });
      toast.success('Canal eliminado');
      router.refresh();
    } catch {
      toast.error('No se pudo eliminar el canal');
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
      aria-label={`Eliminar ${name}`}
    >
      <Trash2 className="size-4" />
    </Button>
  );
}
