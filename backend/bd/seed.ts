import { PrismaClient, ContentStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Stream HLS público de prueba (Apple bipbop) — solo para que el reproductor del
// frontend tenga algo real que reproducir en desarrollo. No usar en producción.
const DEMO_STREAM_URL = 'https://devstreaming-cdn.apple.com/videos/streaming/examples/bipbop_4x3/bipbop_4x3_variant.m3u8';
const DEMO_TENANT_SLUG = 'demo';
const DEMO_ROOT_EMAIL = 'root@wamvideo.local';
const DEMO_ROOT_PASSWORD = 'ChangeMe123!'; // dev-only, documentado en README/FRONTEND.md

// Permisos base del sistema, agrupados por recurso.
const PERMISSIONS = [
  { code: 'users.manage', description: 'Crear, editar y suspender usuarios' },
  { code: 'users.view', description: 'Ver usuarios' },
  { code: 'roles.manage', description: 'Administrar roles y permisos' },
  { code: 'tenants.manage', description: 'Crear y administrar tenants' },
  { code: 'tenants.view', description: 'Ver tenants' },
  { code: 'plans.manage', description: 'Administrar planes de suscripción' },
  { code: 'packages.manage', description: 'Administrar paquetes de canales' },
  { code: 'content.manage', description: 'Crear y editar películas, series y episodios' },
  { code: 'content.publish', description: 'Publicar o despublicar contenido' },
  { code: 'content.view', description: 'Ver contenido' },
  { code: 'content.download', description: 'Descargar contenido para verlo sin conexión' },
  { code: 'channels.manage', description: 'Administrar canales de TV en vivo' },
  { code: 'epg.manage', description: 'Administrar la guía electrónica de programación' },
  { code: 'events.manage', description: 'Crear y administrar eventos en vivo / PPV' },
  { code: 'subscriptions.manage', description: 'Administrar suscripciones de usuarios' },
  { code: 'subscriptions.view', description: 'Ver suscripciones de usuarios' },
  { code: 'payments.manage', description: 'Procesar y ajustar pagos' },
  { code: 'payments.view', description: 'Ver pagos y transacciones' },
  { code: 'comments.create', description: 'Publicar comentarios' },
  { code: 'comments.moderate', description: 'Moderar comentarios de otros usuarios' },
  { code: 'analytics.view', description: 'Ver analíticas y reportes' },
  { code: 'branding.manage', description: 'Administrar branding del tenant' },
  { code: 'audit.view', description: 'Ver el registro de auditoría' },
  { code: 'notifications.manage', description: 'Enviar y administrar notificaciones' },
] as const;

type PermissionCode = (typeof PERMISSIONS)[number]['code'];

const ALL_PERMISSIONS = PERMISSIONS.map((p) => p.code) as PermissionCode[];

const ROLES: { name: string; description: string; permissions: PermissionCode[] }[] = [
  {
    name: 'ROOT',
    description: 'Control total de la plataforma, incluidos todos los tenants',
    permissions: ALL_PERMISSIONS,
  },
  {
    name: 'SUPER_ADMIN',
    description: 'Super Administrador: crea/suspende usuarios y administra planes, paquetes y tenants',
    permissions: [
      'users.manage', 'users.view', 'roles.manage',
      'tenants.manage', 'tenants.view',
      'plans.manage', 'packages.manage',
      'content.manage', 'content.publish',
      'channels.manage', 'epg.manage', 'events.manage',
      'subscriptions.manage', 'subscriptions.view', 'payments.manage', 'payments.view',
      'comments.moderate', 'analytics.view', 'branding.manage',
      'audit.view', 'notifications.manage',
    ],
  },
  {
    name: 'ADMIN_GENERAL',
    description: 'Administrador General de la plataforma',
    permissions: [
      'users.manage', 'users.view',
      'content.manage', 'content.publish',
      'channels.manage', 'epg.manage', 'events.manage',
      'subscriptions.manage', 'subscriptions.view', 'payments.view',
      'comments.moderate', 'analytics.view',
      'audit.view', 'notifications.manage',
    ],
  },
  {
    name: 'ADMIN_TENANT',
    description: 'Administrador con alcance a un tenant específico',
    permissions: [
      'users.manage', 'users.view',
      'plans.manage', 'packages.manage',
      'content.manage', 'content.publish',
      'channels.manage', 'epg.manage', 'events.manage',
      'payments.view', 'comments.moderate',
      'analytics.view', 'branding.manage',
      'notifications.manage',
    ],
  },
  {
    name: 'EDITOR',
    description: 'Edita y publica contenido del catálogo',
    permissions: ['content.manage', 'content.publish', 'content.view'],
  },
  {
    name: 'PRODUCER',
    description: 'Productor: sube contenido y gestiona eventos en vivo',
    permissions: ['content.manage', 'content.view', 'events.manage'],
  },
  {
    name: 'MODERATOR',
    description: 'Modera comentarios y contenido generado por usuarios',
    permissions: ['comments.moderate', 'content.view'],
  },
  {
    name: 'SUPPORT',
    description: 'Soporte a usuarios y suscripciones',
    permissions: ['users.view', 'subscriptions.manage', 'payments.view'],
  },
  {
    name: 'ANALYST',
    description: 'Analista: acceso a reportes y analíticas',
    permissions: ['analytics.view', 'payments.view', 'subscriptions.view'],
  },
  {
    name: 'PREMIUM_USER',
    description: 'Usuario Premium',
    permissions: ['content.view', 'content.download', 'comments.create'],
  },
  {
    name: 'STANDARD_USER',
    description: 'Usuario Estándar',
    permissions: ['content.view', 'comments.create'],
  },
  {
    name: 'FREE_USER',
    description: 'Usuario Gratuito',
    permissions: ['content.view', 'comments.create'],
  },
  {
    name: 'GUEST',
    description: 'Invitado: acceso limitado sin cuenta registrada',
    permissions: ['content.view'],
  },
];

async function main() {
  for (const permission of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code: permission.code },
      update: { description: permission.description },
      create: permission,
    });
  }

  for (const role of ROLES) {
    const createdRole = await prisma.role.upsert({
      where: { name: role.name },
      update: { description: role.description },
      create: { name: role.name, description: role.description },
    });

    for (const code of role.permissions) {
      const permission = await prisma.permission.findUniqueOrThrow({ where: { code } });
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: createdRole.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: { roleId: createdRole.id, permissionId: permission.id },
      });
    }
  }

  await seedDemoData();

  console.log(`Seed completo: ${PERMISSIONS.length} permisos, ${ROLES.length} roles.`);
}

// Tenant + usuario ROOT + catálogo demo, todo vía upsert (idempotente), para que
// `npm run prisma:seed` deje un entorno de desarrollo con datos reales para el frontend.
async function seedDemoData() {
  const tenant = await prisma.tenant.upsert({
    where: { slug: DEMO_TENANT_SLUG },
    update: {},
    create: { name: 'Demo Tenant', slug: DEMO_TENANT_SLUG },
  });

  const passwordHash = await bcrypt.hash(DEMO_ROOT_PASSWORD, 10);
  const rootUser = await prisma.user.upsert({
    where: { email: DEMO_ROOT_EMAIL },
    update: {},
    create: {
      email: DEMO_ROOT_EMAIL,
      passwordHash,
      name: 'Demo Root',
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
    },
  });

  const rootRole = await prisma.role.findUniqueOrThrow({ where: { name: 'ROOT' } });
  const existingRootAssignment = await prisma.userRole.findFirst({
    where: { userId: rootUser.id, roleId: rootRole.id, tenantId: null },
  });
  if (!existingRootAssignment) {
    // tenantId null = rol global (ROOT aplica a todos los tenants, ver JwtStrategy).
    await prisma.userRole.create({ data: { userId: rootUser.id, roleId: rootRole.id, tenantId: null } });
  }

  const movies = [
    { slug: 'demo-bipbop', title: 'Demo: Big Buck Bunny (BipBop)', isPremium: false },
    { slug: 'demo-bipbop-2', title: 'Demo: Segunda película', isPremium: false },
    { slug: 'demo-premium', title: 'Demo Premium (requiere suscripción)', isPremium: true },
  ];
  for (const movie of movies) {
    await prisma.movie.upsert({
      where: { tenantId_slug: { tenantId: tenant.id, slug: movie.slug } },
      update: { status: ContentStatus.PUBLISHED },
      create: {
        tenantId: tenant.id,
        title: movie.title,
        slug: movie.slug,
        synopsis: 'Contenido de demostración para desarrollo local.',
        videoUrl: DEMO_STREAM_URL,
        posterUrl: null,
        isPremium: movie.isPremium,
        status: ContentStatus.PUBLISHED,
      },
    });
  }

  const series = await prisma.series.upsert({
    where: { tenantId_slug: { tenantId: tenant.id, slug: 'demo-series' } },
    update: { status: ContentStatus.PUBLISHED },
    create: {
      tenantId: tenant.id,
      title: 'Demo: Serie de prueba',
      slug: 'demo-series',
      synopsis: 'Serie de demostración para desarrollo local.',
      isPremium: false,
      status: ContentStatus.PUBLISHED,
    },
  });

  const season = await prisma.season.upsert({
    where: { seriesId_number: { seriesId: series.id, number: 1 } },
    update: {},
    create: { seriesId: series.id, number: 1, title: 'Temporada 1' },
  });

  await prisma.episode.upsert({
    where: { seasonId_number: { seasonId: season.id, number: 1 } },
    update: {},
    create: {
      seasonId: season.id,
      number: 1,
      title: 'Episodio 1',
      synopsis: 'Episodio de demostración.',
      videoUrl: DEMO_STREAM_URL,
    },
  });

  console.log(
    `Demo listo: tenant "${DEMO_TENANT_SLUG}", usuario ROOT "${DEMO_ROOT_EMAIL}" / "${DEMO_ROOT_PASSWORD}", ${movies.length} películas + 1 serie publicadas.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
