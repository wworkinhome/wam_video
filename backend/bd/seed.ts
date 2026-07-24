import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

  console.log(`Seed completo: ${PERMISSIONS.length} permisos, ${ROLES.length} roles.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
