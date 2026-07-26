// Set de avatares predefinidos (emoji + gradiente) para elegir en el perfil, al estilo
// Netflix/Disney+. Se guardan como un data-URI SVG autocontenido en `avatarUrl` — no
// dependen de ningún archivo externo, así que se ven igual en cualquier lugar del sitio.
export interface AvatarPreset {
  id: string;
  emoji: string;
  from: string;
  to: string;
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  { id: 'lion', emoji: '🦁', from: '#f59e0b', to: '#b45309' },
  { id: 'cat', emoji: '🐱', from: '#f472b6', to: '#be185d' },
  { id: 'dog', emoji: '🐶', from: '#a78bfa', to: '#6d28d9' },
  { id: 'fox', emoji: '🦊', from: '#fb923c', to: '#c2410c' },
  { id: 'panda', emoji: '🐼', from: '#94a3b8', to: '#334155' },
  { id: 'robot', emoji: '🤖', from: '#38bdf8', to: '#0369a1' },
  { id: 'alien', emoji: '👽', from: '#4ade80', to: '#15803d' },
  { id: 'ghost', emoji: '👻', from: '#e2e8f0', to: '#64748b' },
  { id: 'unicorn', emoji: '🦄', from: '#f0abfc', to: '#a21caf' },
  { id: 'star', emoji: '⭐', from: '#facc15', to: '#a16207' },
  { id: 'rocket', emoji: '🚀', from: '#f87171', to: '#b91c1c' },
  { id: 'crown', emoji: '👑', from: '#fde047', to: '#ca8a04' },
  { id: 'gamer', emoji: '🎮', from: '#818cf8', to: '#4338ca' },
  { id: 'music', emoji: '🎵', from: '#2dd4bf', to: '#0f766e' },
  { id: 'popcorn', emoji: '🍿', from: '#fbbf24', to: '#92400e' },
  { id: 'movie', emoji: '🎬', from: '#f43f5e', to: '#9f1239' },
];

export function avatarDataUri(preset: Pick<AvatarPreset, 'emoji' | 'from' | 'to'>): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0%" stop-color="${preset.from}"/><stop offset="100%" stop-color="${preset.to}"/>` +
    `</linearGradient></defs>` +
    `<rect width="200" height="200" fill="url(#g)"/>` +
    `<text x="50%" y="54%" font-size="108" text-anchor="middle" dominant-baseline="middle">${preset.emoji}</text>` +
    `</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export function defaultAvatarUrl(seedIndex = 0): string {
  return avatarDataUri(AVATAR_PRESETS[seedIndex % AVATAR_PRESETS.length]);
}
