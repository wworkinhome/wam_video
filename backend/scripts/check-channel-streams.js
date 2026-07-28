// Prueba de vida de streams: le pega a cada streamUrl y guarda si respondió (ok) o no
// (broken) en Channel.streamStatus/streamCheckedAt. No descarga el video, solo confirma
// que el servidor responda con un status HTTP válido para la URL del m3u8/manifest.
//
// Uso:
//   node scripts/check-channel-streams.js                       (todos los canales)
//   node scripts/check-channel-streams.js --country=CO
//   node scripts/check-channel-streams.js --category=Deportes
//   node scripts/check-channel-streams.js --status=unchecked     (solo los que nunca se probaron)
//   node scripts/check-channel-streams.js --concurrency=40 --timeout=6000
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function parseArgs() {
  const args = {};
  for (const arg of process.argv.slice(2)) {
    const [key, value] = arg.replace(/^--/, '').split('=');
    args[key] = value ?? true;
  }
  return args;
}

async function checkStream(url, timeoutMs) {
  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: AbortSignal.timeout(timeoutMs),
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; WAMVIDEO-healthcheck/1.0)' },
    });
    res.body?.cancel().catch(() => {});
    return res.ok ? 'ok' : 'broken';
  } catch {
    return 'broken';
  }
}

async function runBatch(channels, timeoutMs) {
  const results = await Promise.all(
    channels.map(async (channel) => ({ id: channel.id, status: await checkStream(channel.streamUrl, timeoutMs) })),
  );
  const now = new Date();
  await Promise.all(
    results.map((r) => prisma.channel.update({ where: { id: r.id }, data: { streamStatus: r.status, streamCheckedAt: now } })),
  );
  return results;
}

async function main() {
  const args = parseArgs();
  const concurrency = args.concurrency ? Number(args.concurrency) : 30;
  const timeoutMs = args.timeout ? Number(args.timeout) : 8000;

  const tenant = args.tenant ? await prisma.tenant.findUnique({ where: { slug: args.tenant } }) : null;

  const where = {
    streamUrl: { not: null },
    ...(tenant ? { tenantId: tenant.id } : {}),
    ...(args.country ? { country: args.country.toUpperCase() } : {}),
    ...(args.category ? { category: args.category } : {}),
    ...(args.status === 'unchecked' ? { streamStatus: null } : args.status ? { streamStatus: args.status } : {}),
  };

  const channels = await prisma.channel.findMany({ where, select: { id: true, streamUrl: true } });
  console.log(`${channels.length} canales a probar (concurrencia ${concurrency}, timeout ${timeoutMs}ms).`);
  if (channels.length === 0) {
    await prisma.$disconnect();
    return;
  }

  let ok = 0;
  let broken = 0;
  const startedAt = Date.now();

  for (let i = 0; i < channels.length; i += concurrency) {
    const batch = channels.slice(i, i + concurrency);
    const results = await runBatch(batch, timeoutMs);
    ok += results.filter((r) => r.status === 'ok').length;
    broken += results.filter((r) => r.status === 'broken').length;
    const done = Math.min(i + concurrency, channels.length);
    if (done % 300 < concurrency || done === channels.length) {
      const elapsedS = Math.round((Date.now() - startedAt) / 1000);
      console.log(`  ${done}/${channels.length} probados — ${ok} ok, ${broken} rotos (${elapsedS}s)`);
    }
  }

  console.log(`\n=== TOTAL: ${ok} ok, ${broken} rotos, de ${channels.length} probados ===`);
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error('FAILED', err);
  await prisma.$disconnect();
  process.exit(1);
});
