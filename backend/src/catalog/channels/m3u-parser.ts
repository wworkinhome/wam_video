export interface ParsedM3UChannel {
  name: string;
  streamUrl: string;
  logoUrl?: string;
  category?: string;
  tvgId?: string;
}

// Parser mínimo de playlists M3U/M3U8 extendidas (formato #EXTM3U / #EXTINF que usan
// prácticamente todos los agregadores IPTV, incluido iptv-org). Solo lee los atributos
// que nos importan (tvg-logo, group-title, tvg-id) — ignora todo lo demás sin fallar.
export function parseM3U(content: string): ParsedM3UChannel[] {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const channels: ParsedM3UChannel[] = [];
  let pending: Partial<ParsedM3UChannel> | null = null;

  for (const line of lines) {
    if (line.startsWith('#EXTINF')) {
      const attrs: Record<string, string> = {};
      for (const match of line.matchAll(/([\w-]+)="([^"]*)"/g)) {
        attrs[match[1]] = match[2];
      }
      const name = line.split(',').pop()?.trim();
      pending = {
        name: normalizeChannelName(name || 'Sin nombre'),
        logoUrl: attrs['tvg-logo'] || undefined,
        category: attrs['group-title'] || undefined,
        tvgId: attrs['tvg-id'] || undefined,
      };
    } else if (!line.startsWith('#')) {
      if (pending) {
        channels.push({ ...pending, name: pending.name ?? 'Sin nombre', streamUrl: line });
        pending = null;
      }
    }
  }

  return channels;
}

// Sufijos de calidad/resolución que las playlists públicas suelen pegarle al nombre,
// entre paréntesis o corchetes, al final: "Canal (1080p)", "Canal [HD] (FHD)", etc.
// Se aplica en loop porque a veces vienen encadenados varios sufijos.
const QUALITY_SUFFIX_PATTERN = /\s*[([]\s*(4K|8K|U?HD|FHD|SD|\d{3,4}[pi])\s*[)\]]\s*$/i;

// Tags de estado que iptv-org agrega entre corchetes al final del nombre
// ("Canal [Geo-blocked]", "Canal [Not 24/7]") — no son parte del nombre real
// del canal, así que se sacan igual que los sufijos de calidad.
const STATUS_TAG_PATTERN = /\s*\[\s*(geo-?\s*blocked|non[\s-]*geo[\s-]*blocked|not\s*24\/?7)\s*\]\s*$/i;

export function normalizeChannelName(rawName: string): string {
  let name = rawName.trim();
  while (QUALITY_SUFFIX_PATTERN.test(name) || STATUS_TAG_PATTERN.test(name)) {
    name = name.replace(QUALITY_SUFFIX_PATTERN, '').replace(STATUS_TAG_PATTERN, '').trim();
  }
  name = name.replace(/\s{2,}/g, ' ').trim();
  return name || rawName.trim();
}

// U+0300–U+036F: combining diacritical marks left behind by normalize('NFD')
// (e.g. the standalone accent from "é" -> "e" + combining acute). Built from
// char codes rather than a literal range to avoid embedding raw combining
// characters in the source file.
const COMBINING_MARKS_PATTERN = new RegExp(`[\\u0300-\\u036f]`, 'g');

export function slugifyChannelName(name: string): string {
  const slug = name
    .normalize('NFD')
    .replace(COMBINING_MARKS_PATTERN, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return slug || 'canal';
}
