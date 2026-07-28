// Paleta determinística para las cards sin poster real: mismo id → mismo gradiente,
// así el catálogo demo no se ve como "roto" mientras no haya artwork cargado.
const GRADIENTS = [
  'from-red-600 to-orange-400',
  'from-red-700 to-red-500',
  'from-amber-600 to-red-400',
  'from-orange-600 to-red-500',
  'from-yellow-600 to-orange-400',
  'from-red-500 to-pink-500',
];

export function gradientFor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return GRADIENTS[hash % GRADIENTS.length];
}
