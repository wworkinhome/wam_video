// Importa la guía de programación (EPG) real desde las mismas fuentes que usan los
// "grabbers" del proyecto open-source https://github.com/iptv-org/epg, replicadas
// directamente acá (sin instalar todo su framework de Node). Es idempotente: reemplaza
// los programas existentes en el rango de fechas importado para cada canal.
// Correr periódicamente (la guía es del futuro cercano, se vuelve obsoleta día a día):
//   node scripts/import-epg.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DAYS_AHEAD = 3;
const REQUEST_DELAY_MS = 800; // varias de estas fuentes son chicas y rate-limitan ráfagas.
const MAX_RETRIES = 2;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function dayStartUnix(offsetDays) {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return Math.floor(d.getTime() / 1000);
}

async function withRetry(fn) {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === MAX_RETRIES) throw err;
      await sleep(REQUEST_DELAY_MS * (attempt + 2));
    }
  }
}

// ─── Fuente: siba.com.co (Colombia) ──────────────────────────────────────────
async function fetchSiba(siteId) {
  const programs = [];
  for (let offset = 0; offset < DAYS_AHEAD; offset++) {
    const ini = dayStartUnix(offset);
    const end = dayStartUnix(offset + 1);
    await withRetry(async () => {
      const params = new URLSearchParams({ servicio: '9', ini: String(ini), end: String(end), chn: siteId });
      const res = await fetch('http://devportal.siba.com.co/index.php?action=grilla', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
        body: params.toString(),
        signal: AbortSignal.timeout(15000),
      });
      const data = await res.json();
      const entry = data.list?.find((item) => item.id === siteId);
      for (const item of entry?.prog ?? []) {
        programs.push({ title: item.nom, startTime: new Date(item.ini * 1000), endTime: new Date(item.fin * 1000) });
      }
    });
    await sleep(REQUEST_DELAY_MS);
  }
  return programs;
}

// ─── Fuente: tv.movistar.com.pe (Perú) ───────────────────────────────────────
async function fetchMovistarPe(siteId) {
  return withRetry(async () => {
    const start = dayStartUnix(0);
    const end = dayStartUnix(DAYS_AHEAD);
    const url =
      `https://contentapi-pe.cdn.telefonica.com/28/default/es-PE/schedules?fields=Title,Description,Start,End,LiveChannelPid` +
      `&orderBy=START_TIME%3Aa&filteravailability=false&starttime=${start}&endtime=${end}&livechannelpids=${siteId}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    const data = await res.json();
    return (data.Content ?? []).map((item) => ({
      title: item.Title,
      description: item.Description || null,
      startTime: new Date(item.Start * 1000),
      endTime: new Date(item.End * 1000),
    }));
  });
}

// ─── Fuente: movistarplus.es (España) ────────────────────────────────────────
async function fetchMovistarEs(siteId) {
  return withRetry(async () => {
    const from = new Date();
    from.setUTCHours(0, 0, 0, 0);
    const url = `https://ottcache.dof6.com/movistarplus/webplayer/OTT/epg?from=${from.toISOString().slice(0, 19)}&span=${DAYS_AHEAD}&channel=${siteId}&version=8&mdrm=true&tlsstream=true&demarcation=18`;
    const res = await fetch(url, {
      headers: { Referer: 'https://www.movistarplus.es/programacion-tv' },
      signal: AbortSignal.timeout(15000),
    });
    const data = await res.json();
    const items = Array.isArray(data) ? data : [data];
    return items
      .filter((item) => item?.FechaHoraInicio && item?.FechaHoraFin)
      .map((item) => ({
        title: item.Titulo || '',
        description: item.Resena || null,
        startTime: new Date(Number(item.FechaHoraInicio)),
        endTime: new Date(Number(item.FechaHoraFin)),
      }));
  });
}

// ─── Fuente: winplay.co (Win Sports, Colombia) ───────────────────────────────
// Requiere un token público + descubrir la URL del componente "epg_grid" antes de
// poder pedir la guía; se cachea en memoria para el resto de la corrida.
let winplayCache = null;
async function fetchWinplayAll() {
  if (winplayCache) return winplayCache;

  const tokenRes = await fetch('https://unity.tbxapis.com/v0/auth/public', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      auth: { sub: '6a561d048728db7c786b53b0941d0dd9', country: null, currentProfile: null, device: null, language: null },
    }),
    signal: AbortSignal.timeout(15000),
  });
  const token = (await tokenRes.json())?.token?.access_token;
  if (!token) throw new Error('winplay.co: no se pudo obtener token');
  const authHeaders = { Authorization: `JWT ${token}` };

  const sections = await fetch('https://unity.tbxapis.com/v0/sections?page=1&pageSize=400', { headers: authHeaders })
    .then((r) => r.json());
  const sectionId = sections.result?.find((s) => s.name === 'Programación')?.id;
  if (!sectionId) throw new Error('winplay.co: sección "Programación" no encontrada');

  const components = await fetch(`https://unity.tbxapis.com/v0/sections/${sectionId}/components`, { headers: authHeaders })
    .then((r) => r.json());
  const itemsUrl = components.result?.find((c) => c.active && c.componentType === 'epg_grid')?.itemsURL;
  if (!itemsUrl) throw new Error('winplay.co: componente epg_grid no encontrado');

  const from = new Date();
  from.setUTCHours(0, 0, 0, 0);
  const to = new Date(from.getTime() + DAYS_AHEAD * 24 * 60 * 60 * 1000);
  const epg = await fetch(`${itemsUrl}?pageSize=25&page=1&fromEpg=${from.toISOString()}&toEpg=${to.toISOString()}`, {
    headers: authHeaders,
  }).then((r) => r.json());

  winplayCache = epg.result ?? [];
  return winplayCache;
}

async function fetchWinplay(siteId) {
  return withRetry(async () => {
    const channels = await fetchWinplayAll();
    const match = channels.find((c) => c.content?.signalId === siteId);
    return (match?.content?.epg ?? []).map((item) => ({
      title: item.programName || item.title,
      description: item.description || null,
      startTime: new Date(item.startTime),
      endTime: new Date(item.endTime),
    }));
  });
}

// ─── Mapeo canal-en-nuestra-DB -> fuente + site_id ───────────────────────────
const CHANNEL_SOURCES = {
  'Canal RCN': { source: fetchSiba, siteId: '399' },
  'RCN Televisión': { source: fetchSiba, siteId: '399' },
  'Caracol TV': { source: fetchSiba, siteId: '394' },
  'Señal Colombia': { source: fetchSiba, siteId: '570' },
  'Teleantioquia': { source: fetchSiba, siteId: '580' },
  'Canal Institucional': { source: fetchSiba, siteId: '398' },
  'Canal Congreso': { source: fetchSiba, siteId: '397' },
  'Discovery Kids': { source: fetchSiba, siteId: '427' },
  'National Geographic Latin America': { source: fetchSiba, siteId: '550' },
  'Disney Channel': { source: fetchSiba, siteId: '430' },
  'MTV Latino': { source: fetchSiba, siteId: '544' },
  'Win +': { source: fetchWinplay, siteId: 'winsportsplus' },
  'Win Sport': { source: fetchWinplay, siteId: 'winsports' },
  'Panamericana TV': { source: fetchMovistarPe, siteId: 'lch2209' },
  'Global TV': { source: fetchMovistarPe, siteId: 'lch6309' },
  'La 1': { source: fetchMovistarEs, siteId: 'TVE' },
};

async function main() {
  const channels = await prisma.channel.findMany({
    where: { name: { in: Object.keys(CHANNEL_SOURCES) } },
    select: { id: true, name: true },
  });
  console.log(`Canales encontrados en la DB: ${channels.length} de ${Object.keys(CHANNEL_SOURCES).length} mapeados`);

  const rangeStart = new Date(dayStartUnix(0) * 1000);
  const rangeEnd = new Date(dayStartUnix(DAYS_AHEAD) * 1000);

  let totalInserted = 0;
  const failedChannels = [];

  for (const channel of channels) {
    const { source, siteId } = CHANNEL_SOURCES[channel.name];
    let items = [];
    try {
      items = await source(siteId);
    } catch (err) {
      failedChannels.push(channel.name);
      console.log(`${channel.name}: sin datos (falló la fuente: ${err.message}), se conserva lo existente`);
      continue;
    }

    const programs = items
      .filter((p) => p.title && p.startTime && p.endTime)
      .map((p) => ({ channelId: channel.id, title: p.title, description: p.description ?? null, startTime: p.startTime, endTime: p.endTime }));

    // Idempotente: reemplaza lo que haya en el rango para este canal.
    await prisma.epgProgram.deleteMany({
      where: { channelId: channel.id, startTime: { gte: rangeStart, lt: rangeEnd } },
    });
    if (programs.length > 0) {
      await prisma.epgProgram.createMany({ data: programs });
    }

    console.log(`${channel.name}: ${programs.length} programas importados`);
    totalInserted += programs.length;
    await sleep(300);
  }

  console.log(`\nTotal: ${totalInserted} programas importados para ${channels.length - failedChannels.length}/${channels.length} canales.`);
  if (failedChannels.length > 0) {
    console.log(`Canales sin datos (reintentar más tarde): ${failedChannels.join(', ')}`);
  }
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error('FAILED', err);
  await prisma.$disconnect();
  process.exit(1);
});
