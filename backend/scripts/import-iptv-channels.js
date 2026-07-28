// Importa canales (nombre, logo, categoría, URL de stream) desde las playlists M3U
// públicas por país que publica https://github.com/iptv-org/iptv. Ese repo agrega listas
// de terceros: la mayoría son simulcasts oficiales que los propios canales dejan abiertos,
// pero la legalidad varía por canal/país y no la garantiza ni iptv-org ni nosotros — por
// eso este script NUNCA corre solo/automático, hay que invocarlo a mano, y conviene revisar
// el listado resultante en el admin antes de darlo por bueno.
//
// Uso:
//   node scripts/import-iptv-channels.js --country=CO --tenant=demo
//   node scripts/import-iptv-channels.js --country=CO --category=Noticias,Deportes
//   node scripts/import-iptv-channels.js --all --tenant=demo   (TODOS los países que tenga iptv-org)
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const REQUEST_DELAY_MS = 400;

const CATEGORY_TRANSLATIONS = {
  news: 'Noticias',
  sports: 'Deportes',
  music: 'Música',
  kids: 'Kids',
  entertainment: 'Entretenimiento',
  movies: 'Películas',
  general: 'General',
  religious: 'Religioso',
  culture: 'Cultura',
  education: 'Educación',
};

const DIACRITICS_REGEX = new RegExp('[\\u0300-\\u036f]', 'g');
const QUALITY_SUFFIX_PATTERN = /\s*[([]\s*(4K|8K|U?HD|FHD|SD|\d{3,4}[pi])\s*[)\]]\s*$/i;
const STATUS_TAG_PATTERN = /\s*\[\s*(geo-?\s*blocked|non[\s-]*geo[\s-]*blocked|not\s*24\/?7)\s*\]\s*$/i;

function normalizeChannelName(rawName) {
  let name = rawName.trim();
  while (QUALITY_SUFFIX_PATTERN.test(name) || STATUS_TAG_PATTERN.test(name)) {
    name = name.replace(QUALITY_SUFFIX_PATTERN, '').replace(STATUS_TAG_PATTERN, '').trim();
  }
  name = name.replace(/\s{2,}/g, ' ').trim();
  return name || rawName.trim();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function slugify(value) {
  const slug = value
    .normalize('NFD')
    .replace(DIACRITICS_REGEX, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return slug || 'canal';
}

function parseArgs() {
  const args = {};
  for (const arg of process.argv.slice(2)) {
    const [key, value] = arg.replace(/^--/, '').split('=');
    args[key] = value ?? true;
  }
  return args;
}

function parseM3U(content) {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const channels = [];
  let pending = null;

  for (const line of lines) {
    if (line.startsWith('#EXTINF')) {
      const attrs = {};
      for (const match of line.matchAll(/([\w-]+)="([^"]*)"/g)) {
        attrs[match[1]] = match[2];
      }
      const name = line.split(',').pop()?.trim();
      pending = {
        name: normalizeChannelName(name || 'Sin nombre'),
        logoUrl: attrs['tvg-logo'] || undefined,
        category: attrs['group-title'] || undefined,
      };
    } else if (!line.startsWith('#')) {
      if (pending) {
        channels.push({ ...pending, streamUrl: line });
        pending = null;
      }
    }
  }
  return channels;
}

function translateCategory(rawCategory) {
  if (!rawCategory) return undefined;
  const key = rawCategory.trim().toLowerCase();
  return CATEGORY_TRANSLATIONS[key] ?? rawCategory;
}

// Procesa un país contra un Map de slugs ya cargado en memoria (compartido entre países
// para evitar colisiones de slug cross-país y para no golpear la DB con un SELECT por
// canal). Los nuevos se insertan con createMany (un solo round-trip); los existentes solo
// se actualizan si algo realmente cambió.
async function importCountry(tenant, countryCode, categoryFilter, existingBySlug) {
  const url = `https://iptv-org.github.io/iptv/countries/${countryCode.toLowerCase()}.m3u`;
  let res;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(20000) });
  } catch (err) {
    return { countryCode, error: err.message, total: 0, created: 0, updated: 0, skipped: 0 };
  }
  if (!res.ok) {
    return { countryCode, error: `HTTP ${res.status}`, total: 0, created: 0, updated: 0, skipped: 0 };
  }

  const text = await res.text();
  let parsed = parseM3U(text);
  if (categoryFilter) {
    parsed = parsed.filter((c) => c.category && categoryFilter.includes(c.category.trim().toLowerCase()));
  }

  const toCreate = [];
  let updated = 0;
  let skipped = 0;

  for (const item of parsed) {
    if (!item.streamUrl) {
      skipped++;
      continue;
    }
    const slug = slugify(item.name);
    const category = translateCategory(item.category);
    const existing = existingBySlug.get(slug);

    if (existing && existing.id) {
      if (existing.streamUrl !== item.streamUrl || (category && existing.category !== category)) {
        await prisma.channel.update({
          where: { id: existing.id },
          data: {
            streamUrl: item.streamUrl,
            logoUrl: item.logoUrl ?? existing.logoUrl,
            category: category ?? existing.category,
          },
        });
        existingBySlug.set(slug, { ...existing, streamUrl: item.streamUrl, category: category ?? existing.category });
        updated++;
      }
    } else if (!existing) {
      toCreate.push({
        tenantId: tenant.id,
        name: item.name,
        slug,
        streamUrl: item.streamUrl,
        logoUrl: item.logoUrl,
        category,
        country: countryCode,
      });
      // Reservar el slug en memoria (sin id todavía) para no duplicarlo si otro país repite el nombre.
      existingBySlug.set(slug, { id: null, streamUrl: item.streamUrl, category });
    } else {
      skipped++;
    }
  }

  if (toCreate.length > 0) {
    await prisma.channel.createMany({ data: toCreate, skipDuplicates: true });
    const inserted = await prisma.channel.findMany({
      where: { tenantId: tenant.id, slug: { in: toCreate.map((c) => c.slug) } },
    });
    for (const ch of inserted) existingBySlug.set(ch.slug, ch);
  }

  return { countryCode, total: parsed.length, created: toCreate.length, updated, skipped };
}

async function main() {
  const args = parseArgs();
  const categoryFilter = args.category ? args.category.split(',').map((c) => c.trim().toLowerCase()) : null;

  const tenant = args.tenant
    ? await prisma.tenant.findUnique({ where: { slug: args.tenant } })
    : await prisma.tenant.findFirst();
  if (!tenant) {
    console.error(`No se encontró el tenant${args.tenant ? ` "${args.tenant}"` : ''}.`);
    process.exit(1);
  }

  let countryCodes;
  if (args.all) {
    console.log('Descargando lista de países de iptv-org...');
    const res = await fetch('https://iptv-org.github.io/api/countries.json', { signal: AbortSignal.timeout(20000) });
    const countries = await res.json();
    countryCodes = countries.map((c) => c.code);
    console.log(`${countryCodes.length} países a procesar (esto puede tardar bastante).`);
  } else {
    const single = (args.country || '').toUpperCase();
    if (!single || single.length !== 2) {
      console.error('Falta --country=XX (código ISO 3166-1 alpha-2) o --all.');
      process.exit(1);
    }
    countryCodes = [single];
  }

  console.log('Cargando canales existentes del tenant...');
  const existing = await prisma.channel.findMany({ where: { tenantId: tenant.id } });
  const existingBySlug = new Map(existing.map((c) => [c.slug, c]));
  console.log(`${existingBySlug.size} canales existentes en catálogo.\n`);

  const results = [];
  for (const code of countryCodes) {
    const result = await importCountry(tenant, code, categoryFilter, existingBySlug);
    results.push(result);
    if (result.error) {
      console.log(`${code}: sin playlist (${result.error})`);
    } else if (result.total > 0) {
      console.log(`${code}: ${result.total} en playlist -> ${result.created} nuevos, ${result.updated} actualizados, ${result.skipped} omitidos`);
    }
    await sleep(REQUEST_DELAY_MS);
  }

  const totals = results.reduce(
    (acc, r) => ({
      created: acc.created + r.created,
      updated: acc.updated + r.updated,
      skipped: acc.skipped + r.skipped,
    }),
    { created: 0, updated: 0, skipped: 0 },
  );
  const failedCountries = results.filter((r) => r.error).map((r) => r.countryCode);

  console.log(`\n=== TOTAL: ${totals.created} nuevos, ${totals.updated} actualizados, ${totals.skipped} omitidos, en ${countryCodes.length} países ===`);
  if (failedCountries.length > 0) {
    console.log(`Países sin playlist disponible (${failedCountries.length}): ${failedCountries.join(', ')}`);
  }
  console.log('Revisá el listado en /admin/canales — algunos streams de listas públicas caen o cambian de URL seguido.');
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error('FAILED', err);
  await prisma.$disconnect();
  process.exit(1);
});
