'use client';

import { useCallback, useRef, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

// Reemplazo de window.confirm() con la identidad visual de la marca (mismo
// tratamiento que la pantalla de login: logo grande difuminado de fondo +
// glow rojo). Uso: const { confirm, ConfirmDialog } = useConfirmDialog();
// await confirm({ title, description }) devuelve true/false; renderizar
// <ConfirmDialog /> una vez en el componente.
export function useConfirmDialog() {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions) => {
    setOptions(opts);
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  function handleClose(result: boolean) {
    setOpen(false);
    resolverRef.current?.(result);
    resolverRef.current = null;
  }

  const ConfirmDialog = (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) handleClose(false);
      }}
    >
      <DialogContent showCloseButton={false} className="max-w-sm gap-0 overflow-hidden rounded-2xl border-none bg-[#0e0b0b] p-0">
        <div className="relative flex flex-col items-center gap-5 px-6 py-9 text-center">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(220,38,38,0.22),transparent_60%)]" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:28px_28px]" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo_definitivo_transparent.png"
            alt=""
            className="pointer-events-none absolute top-1/2 right-[-18%] w-72 -translate-y-1/2 opacity-[0.14]"
          />

          <div className="relative z-10 flex flex-col items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo_definitivo_transparent.png" alt="WAMVIDEO" className="h-8 w-auto opacity-90" />
            <div className="flex flex-col gap-1.5">
              <h2 className="text-lg font-bold text-white">{options?.title}</h2>
              {options?.description && <p className="text-sm text-white/60">{options.description}</p>}
            </div>
            <div className="mt-2 flex w-full gap-3">
              <Button variant="outline" className="flex-1" onClick={() => handleClose(false)}>
                {options?.cancelLabel ?? 'Cancelar'}
              </Button>
              <Button
                className={cn('flex-1', options?.destructive && 'bg-destructive text-white hover:bg-destructive/80')}
                onClick={() => handleClose(true)}
              >
                {options?.confirmLabel ?? 'Confirmar'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  return { confirm, ConfirmDialog };
}
