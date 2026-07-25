// Paleta determinística para las cards sin poster real: mismo id → mismo gradiente,
// así el catálogo demo no se ve como "roto" mientras no haya artwork cargado.
const GRADIENTS = [
  'from-violet-600 to-fuchsia-500',
  'from-blue-600 to-cyan-400',
  'from-rose-600 to-orange-400',
  'from-emerald-600 to-teal-400',
  'from-amber-600 to-yellow-400',
  'from-indigo-600 to-purple-400',
];

export function gradientFor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return GRADIENTS[hash % GRADIENTS.length];
}
