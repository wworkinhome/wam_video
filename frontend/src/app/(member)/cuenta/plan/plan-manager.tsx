import { Sparkles } from 'lucide-react';

// Los pagos todavía no están habilitados (uso familiar/de amigos por ahora).
// En vez del flujo real de planes/checkout (Wompi), se muestra este aviso.
// Reactivar es simple: restaurar el componente que usa los hooks de
// use-billing.ts (usePlans/useMySubscription/useCreateCheckout) — el backend
// y esos hooks no se tocaron.
export function PlanManager() {
  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="text-3xl font-bold text-white">Mi plan</h1>
        <p className="mt-1 text-white/60">Gestioná tu suscripción y método de pago.</p>
      </div>

      <div className="flex flex-col items-center gap-4 rounded-xl border border-white/10 bg-card p-10 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-accent-glow/15 text-accent-glow">
          <Sparkles className="size-7" />
        </span>
        <div>
          <p className="text-xl font-semibold text-white">Próximamente</p>
          <p className="mt-2 max-w-sm text-sm text-white/60">
            Los pagos y planes de suscripción todavía no están activados. Por ahora tenés acceso
            completo sin costo.
          </p>
        </div>
      </div>
    </div>
  );
}
