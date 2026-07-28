// Limpieza única de nombres de canal ya importados: saca sufijos de calidad/resolución
// pegados por las playlists públicas ("Canal (1080p)", "Canal [HD]"). Los futuros imports
// (import-iptv-channels.js / el import M3U del admin) ya aplican esto solos — este script
// es solo para poner al día lo que ya está en la base.
//
// Uso: node scripts/normalize-channel-names.js [--tenant=demo] [--dry-run]
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const QUALITY_SUFFIX_PATTERN = /\s*[([]\s*(4K|8K|U?HD|FHD|SD|\d{3,4}[pi])\s*[)\]]\s*$/i;
const STATUS_TAG_PATTERN = /\s*\[\s*(geo-?\s*blocked|non[\s-]*geo[\s-]*blocked|not\s*24\/?7)\s*\]\s*$/i;
const CONCURRENCY = 20;

function normalizeChannelName(rawName) {
  let name = rawName.trim();
  while (QUALITY_SUFFIX_PATTERN.test(name) || STATUS_TAG_PATTERN.test(name)) {
    name = name.replace(QUALITY_SUFFIX_PATTERN, '').replace(STATUS_TAG_PATTERN, '').trim();
  }
  name = name.replace(/\s{2,}/g, ' ').trim();
  return name || rawName.trim();
}

function parseArgs() {
  const args = {};
  for (const arg of process.argv.slice(2)) {
    const [key, value] = arg.replace(/^--/, '').split('=');
    args[key] = value ?? true;
  }
  return args;
}

async function processBatch(items, dryRun) {
  await Promise.all(
    items.map(async ({ id, name, cleaned }) => {
      if (dryRun) return;
      await prisma.channel.update({ where: { id }, data: { name: cleaned } });
    }),
  );
}

async function main() {
  const args = parseArgs();
  const dryRun = Boolean(args['dry-run']);

  const tenant = args.tenant ? await prisma.tenant.findUnique({ where: { slug: args.tenant } }) : null;
  const where = tenant ? { tenantId: tenant.id } : {};

  const channels = await prisma.channel.findMany({ where, select: { id: true, name: true } });
  console.log(`${channels.length} canales cargados${tenant ? ` (tenant ${args.tenant})` : ''}.`);

  const toUpdate = [];
  for (const channel of channels) {
    const cleaned = normalizeChannelName(channel.name);
    if (cleaned !== channel.name) {
      toUpdate.push({ id: channel.id, name: channel.name, cleaned });
    }
  }

  console.log(`${toUpdate.length} nombres necesitan limpieza.`);
  if (dryRun) {
    console.log('--dry-run: no se escribe nada. Primeros 30 ejemplos:');
    for (const item of toUpdate.slice(0, 30)) {
      console.log(`  "${item.name}" -> "${item.cleaned}"`);
    }
    await prisma.$disconnect();
    return;
  }

  for (let i = 0; i < toUpdate.length; i += CONCURRENCY) {
    const batch = toUpdate.slice(i, i + CONCURRENCY);
    await processBatch(batch, false);
    if (i % 500 === 0) console.log(`  ${Math.min(i + CONCURRENCY, toUpdate.length)}/${toUpdate.length}...`);
  }

  console.log(`\nListo: ${toUpdate.length} nombres actualizados.`);
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error('FAILED', err);
  await prisma.$disconnect();
  process.exit(1);
});
