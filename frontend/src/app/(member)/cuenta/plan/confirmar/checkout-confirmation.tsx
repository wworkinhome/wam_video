import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Los pagos todavía no están habilitados, así que esta ruta (destino del
// callback de Wompi) nunca debería alcanzarse desde la UI — pero si alguien
// entra directo por URL, mostramos el mismo aviso de "Próximamente" en vez
// de intentar sincronizar un pago real.
export function CheckoutConfirmation() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-20 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-accent-glow/15 text-accent-glow">
        <Sparkles className="size-7" />
      </span>
      <p className="text-xl font-semibold text-white">Próximamente</p>
      <p className="text-sm text-white/60">Los pagos y planes de suscripción todavía no están activados.</p>
      <Button render={<Link href="/cuenta/plan" />} nativeButton={false} className="mt-4">
        Volver a mi plan
      </Button>
    </div>
  );
}
