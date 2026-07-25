# WAMVIDEO — Frontend y su conexión con el backend

Estado: **construido** (scaffold funcional end-to-end contra el backend real de Supabase — auth, catálogo público, y área de miembro completa). Quedan fuera de este scaffold, deliberadamente: panel admin/CMS, Canales/EPG/Eventos/Pagos/Suscripciones/Notificaciones (sus módulos de backend no existen todavía), descargas (más propio de apps móviles/TV), y sincronización en vivo de Watch Party (el backend es solo REST). Este documento se actualiza a medida que se construye, igual que [ARCHITECTURE.md](./ARCHITECTURE.md).

Stack real usado: Next.js 16 (App Router, Turbopack) + TypeScript, Tailwind CSS v4 + shadcn/ui (estilo "base-nova", sobre `@base-ui/react` en vez de Radix), TanStack Query, hls.js. Next.js 16 renombró `middleware.ts` → `proxy.ts` (mismo comportamiento) — el archivo real de este proyecto es `frontend/src/proxy.ts`.

Stack según el documento maestro: **Next.js**, desplegado en **Vercel**. `frontend/` es un proyecto hermano de `backend/` — no comparten `node_modules` ni código; la única frontera entre ambos es la API HTTP.

## Estructura de carpetas propuesta

Usando el App Router de Next.js, con route groups que separan las tres audiencias del producto (visitante público, miembro autenticado, panel admin/CMS):

```
frontend/
├─ src/
│  ├─ app/
│  │  ├─ (public)/                 # sin sesión — landing + catálogo de exploración
│  │  │  ├─ page.tsx               # Landing
│  │  │  ├─ peliculas/[slug]/
│  │  │  ├─ series/[slug]/
│  │  │  ├─ canales/                # listado de TV en vivo
│  │  │  ├─ epg/
│  │  │  └─ eventos/[slug]/
│  │  ├─ (auth)/
│  │  │  ├─ login/
│  │  │  └─ registro/
│  │  ├─ (member)/                 # requiere sesión — layout valida JWT
│  │  │  ├─ perfiles/
│  │  │  ├─ ver/{movie|episode}/[id]/   # Reproductor
│  │  │  ├─ favoritos/
│  │  │  ├─ continuar-viendo/
│  │  │  ├─ descargas/
│  │  │  └─ notificaciones/
│  │  ├─ (admin)/                  # requiere permisos RBAC — CMS/back-office
│  │  │  ├─ tenants/               # solo ROOT/SUPER_ADMIN
│  │  │  ├─ usuarios/
│  │  │  ├─ catalogo/              # CRUD Movies/Series/Seasons/Episodes/Genres
│  │  │  ├─ canales/ epg/ eventos/
│  │  │  ├─ planes/ paquetes/
│  │  │  ├─ suscripciones/ pagos/
│  │  │  ├─ analiticas/
│  │  │  ├─ branding/
│  │  │  └─ auditoria/
│  │  └─ middleware.ts             # resolución de tenant + guard de auth (ver abajo)
│  ├─ components/
│  ├─ lib/
│  │  ├─ api/                      # cliente HTTP tipado, un archivo por recurso
│  │  │  ├─ client.ts               # fetch wrapper: base URL, header Authorization, manejo de errores
│  │  │  ├─ auth.ts                 # login/registro
│  │  │  ├─ movies.ts series.ts channels.ts ...
│  │  ├─ auth/                      # sesión: guardar/leer JWT, contexto de usuario
│  │  └─ tenant/                    # contexto de tenant activo (ver "Multi-tenant" abajo)
│  ├─ hooks/
│  └─ types/                        # tipos que reflejan los DTOs/entidades del backend
├─ public/
└─ .env.local                       # NEXT_PUBLIC_API_URL, etc. (no versionado)
```

Decisiones **no tomadas todavía**, deliberadamente (mismo criterio que "decisión abierta" en ARCHITECTURE.md — no diseñar sobre requisitos hipotéticos):

- Librería de estilos (Tailwind, CSS Modules, etc.) — el documento maestro no la especifica.
- Librería de data-fetching/cache en cliente (TanStack Query, SWR, o `fetch` nativo de Server Components) — a decidir cuando se construya la primera pantalla que la necesite.
- Manejo de estado global de UI (Zustand, Context, etc.) más allá de sesión/tenant.

## Conexión con el backend

### Configuración base

El backend NestJS **no** usa un prefijo global (`app.setGlobalPrefix`) — las rutas cuelgan directo de la raíz: `/auth/login`, `/movies`, `/tenants`, etc. (ver `backend/src/main.ts`). El frontend debe apuntar a la raíz de la API:

```
# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3000   # dev; en prod, la URL de Railway/Contabo
```

### Gaps cerrados

Los tres bloqueantes que se habían detectado auditando `backend/src/` (CORS, identidad tras login, resolución de tenant) ya están resueltos:

1. **CORS habilitado.** `main.ts` llama a `app.enableCors({ origin: frontendUrls, credentials: true })`, leyendo los orígenes permitidos de `FRONTEND_URL` (coma-separados; default `http://localhost:3001`). Configurar `FRONTEND_URL` en `backend/.env` para que incluya la URL real del frontend en cada entorno (dev/staging/prod).
2. **`GET /auth/me`** (requiere `Authorization: Bearer`) devuelve `{ id, email, name, avatarUrl, status, tenant: { id, name, slug } | null, globalPermissions, tenantPermissions }`. Es la llamada que el frontend hace justo después de guardar el JWT (o en cada carga de página) para saber quién es el usuario y qué puede ver.
3. **`GET /tenants/resolve?domain=...` / `?slug=...`** (público, sin JWT) devuelve `{ id, name, slug, domain, branding }` para un tenant `ACTIVE`, o `404` si no existe/está suspendido. Este es el endpoint que `middleware.ts` debe llamar para mapear el `Host` de la request a un `tenantId`.

Con esto, el frontend ya puede completar un flujo de login real: `POST /auth/login` → guardar JWT → `GET /auth/me` → render condicional por permisos/tenant.

### Área de miembro ya disponible

Además de Auth/Tenants/Catalog, el backend ahora expone el área de miembro completa (ver [ARCHITECTURE.md § Fase 1](./ARCHITECTURE.md#fase-1--mvp-vod) para el detalle de cada módulo): `/profiles`, `/devices`, `/profiles/:profileId/favorites`, `/profiles/:profileId/continue-watching`, `/playback/movies/:id` · `/playback/episodes/:id` · `/playback/heartbeat`, `/profiles/:profileId/downloads` + `/downloads/:id/revoke`, y `/watch-parties` (+ `/code/:code`, `/:id/join`, `/:id/start`, `/:id/end`). Todas requieren `Authorization: Bearer` y son ownership-based (no piden permisos RBAC) — alcanza con estar logueado y ser el dueño del `profileId`/recurso.

Nota para el reproductor: `GET /playback/movies/:id` devuelve `403` si el contenido es `isPremium` y el usuario no tiene una `Subscription` activa — pero como `SubscriptionsModule` (autoservicio de compra) todavía no existe (Fase 2), hoy no hay forma de que un usuario consiga una suscripción activa desde la UI. Hasta que exista, probar contenido premium requiere crear la fila `Subscription` a mano (Prisma Studio) para el usuario de prueba.

### Flujo de autenticación

1. `POST /auth/login` con `{ email, password }` → `{ accessToken }` (JWT firmado con `JWT_SECRET`, expira según `JWT_EXPIRES_IN`, hoy fijo en `1d` — no hay refresh token, así que expirado el JWT el usuario debe volver a hacer login).
2. El frontend guarda el `accessToken`. Recomendado: una cookie `httpOnly` seteada por un route handler propio de Next.js (proxy del login) en vez de `localStorage`, para reducir superficie de XSS — a definir cuando se implemente.
3. Cada request autenticada agrega `Authorization: Bearer <accessToken>`.
4. Rutas protegidas en el backend (`@UseGuards(JwtAuthGuard, PermissionsGuard)` + `@Permissions('codigo.permiso')`) devuelven `401` si el JWT es inválido/expiró, `403` si falta el permiso. El frontend debe mapear ambos a "volver a login" y "no autorizado", respectivamente.

### Forma de las respuestas

- Listados paginados (`GET /movies`, `GET /tenants`, etc., vía `PaginationQueryDto`): `{ data: T[], total: number, page: number, limit: number }`. Query params: `page` (default 1), `limit` (default 20, máx 100).
- Errores de validación (`class-validator`, `whitelist: true, forbidNonWhitelisted: true` en el `ValidationPipe` global): `400` con el array de mensajes estándar de Nest.
- Conflictos de unicidad (slug duplicado en un tenant, etc.): `409`, manejado en el backend por `handlePrismaWrite` (`backend/src/common/prisma-errors.util.ts`).

### Multi-tenant en el frontend

Dado que el modelo es un tenant por dominio/subdominio (`Tenant.domain`, `Tenant.slug`, `TenantBranding`), `middleware.ts` en Next.js es el lugar natural para:

1. Leer el `Host` header de la request entrante.
2. Resolver ese host a un `tenantId` llamando a `GET /tenants/resolve?domain=...` (sección "Gaps cerrados" arriba) — con cache corta (el dominio de un tenant no cambia seguido).
3. Propagar el `tenantId` resuelto al resto de la request (cookie o header interno) para que todo llamado a la API lo incluya sin que cada página tenga que resolverlo de nuevo.
4. Aplicar el branding del tenant (`TenantBranding.logoUrl`, `primaryColor`, etc.) al layout raíz.

Esto reemplaza, en producción, el `tenantId` como query param manual que usan hoy los controllers del catálogo — ese query param seguirá existiendo en la API (es como Postman/curl seguirán probándola), pero el frontend no debería pedírselo al usuario.
