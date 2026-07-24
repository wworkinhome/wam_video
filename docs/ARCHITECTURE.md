# WAMVIDEO — Arquitectura de backend

Mapa de módulos del backend NestJS, organizado por fase del roadmap. `✅` construido, `🟡` parcial/rebanada mínima, `⬜` pendiente.

Todo el código de esta sección vive bajo [`backend/`](../backend/): API NestJS en `backend/src/`, base de datos (schema + seed de Prisma) en `backend/bd/`. `frontend/` (Next.js) es un proyecto hermano independiente, sin código compartido por ahora.

Los módulos de área de miembro (Profiles/Devices/Favorites/WatchHistory/Playback/Downloads/WatchParty) viven agrupados bajo `backend/src/member/`, importados por un único `MemberModule` — mismo patrón que `CatalogModule` agrupa Genres/Movies/Series.

Documentación relacionada: esquema completo de la base de datos en [DATABASE.md](./DATABASE.md); estructura propuesta del frontend y cómo se conecta a esta API en [FRONTEND.md](./FRONTEND.md).

## Fase 1 — MVP VOD

| Módulo | Estado | Notas |
|---|---|---|
| AuthModule | ✅ | JWT + roles/permisos, con aislamiento multi-tenant aplicado (ver sección "Aislamiento multi-tenant"). Incluye `GET /auth/me` (identidad + tenant + permisos ya resueltos, para que el frontend sepa qué mostrar tras el login). |
| TenantsModule | ✅ | CRUD de tenants (permisos globales ROOT/SUPER_ADMIN) + `GET /tenants/resolve?domain=\|slug=` público, para que el frontend resuelva el tenant a partir del `Host` de la request. |
| CatalogModule (Genres/Movies/Series/Seasons/Episodes) | ✅ | Aislamiento multi-tenant aplicado en create/update/delete/publish/archive. Falta exponer CRUD de `MediaTrack` (subtítulos/audios) sobre Movie/Episode. |
| ProfilesModule | ✅ | CRUD de `Profile` bajo `/profiles`, ownership por usuario autenticado (no RBAC). `pinCode` se guarda hasheado (bcrypt) y nunca se devuelve — la respuesta expone `hasPin: boolean`. |
| PlaybackModule (Reproductor) | ✅ | `GET /playback/movies/:id` y `/playback/episodes/:id` devuelven `videoUrl` + `mediaTracks` si el contenido está `PUBLISHED` y (si `isPremium`) el usuario tiene una `Subscription` `ACTIVE`/`TRIALING` — sin esperar a que exista SubscriptionsModule (Fase 2), la entitlement check consulta la tabla directo. `POST /playback/heartbeat` alimenta `WatchHistory` vía `WatchHistoryModule`. |
| FavoritesModule | ✅ | CRUD sobre `Favorite` bajo `/profiles/:profileId/favorites`. Deduplica buscar-antes-de-insertar (ver caveat de FK nullable en DATABASE.md). |
| WatchHistoryModule (Continuar viendo) | ✅ | `GET /profiles/:profileId/continue-watching`. El upsert de progreso lo expone como servicio (`WatchHistoryService.upsertProgress`), consumido por PlaybackModule. |
| DownloadsModule (Descargas) | ✅ | CRUD sobre `DownloadRequest` bajo `/profiles/:profileId/downloads` + `/downloads/:id/revoke`. Requiere un `Device` válido — ver DevicesModule abajo. |
| WatchPartyModule | ✅ | `POST /watch-parties` (host = usuario autenticado, genera `code` único de 6 caracteres), `GET /watch-parties/:id`, `GET /watch-parties/code/:code`, `:id/join`, `:id/start`, `:id/end`. Autorización por ownership (host), no por RBAC. |

## Fase 2 — Suscripciones y App móvil

| Módulo | Estado | Notas |
|---|---|---|
| PlansModule | ⬜ | Tabla `Plan` ya existe. Permiso `plans.manage`. |
| SubscriptionsModule | ⬜ | Tabla `Subscription` ya existe. Autoservicio (`POST /me/subscriptions`) + vista admin (`subscriptions.manage`, `subscriptions.view`). |
| PaymentsModule | ⬜ | Tabla `Payment` ya existe. Webhook de proveedor de pago — **decisión abierta**: Stripe vs MercadoPago vs otro, no tomada aún. |
| DevicesModule | 🟡 | Existe una rebanada mínima (`/devices` — self-registro/listado/baja) porque `DownloadRequest.deviceId` la necesitaba ya en Fase 1. Falta lo propio de Fase 2: aplicar `Plan.maxDevices`, revocación remota/administrativa, wiring de `pushToken` con Notifications. |
| NotificationsModule | ⬜ | Usa el modelo `Notification`. |

## Fase 3 — TV en vivo, EPG y SaaS multi-tenant

| Módulo | Estado | Notas |
|---|---|---|
| ChannelsModule | ⬜ | Tabla `Channel` ya existe, incluye flags `dvrEnabled`/`catchupWindowHours`/`timeshiftEnabled`. |
| EpgModule | ⬜ | Tabla `EpgProgram` ya existe. |
| EventsModule | ⬜ | Tabla `Event` ya existe (LIVE/PPV). |
| ChannelPackagesModule | ⬜ | Tablas `ChannelPackage`/`ChannelPackageChannel`/`PlanPackage` ya existen. |
| BrandingModule | ⬜ | Tabla `TenantBranding` ya existe. |

Esta es la fase donde el aislamiento multi-tenant deja de ser "deuda técnica" y pasa a ser el requisito central del roadmap (SaaS multi-tenant). **Todo módulo de esta fase debe nacer usando el patrón de la sección siguiente**, igual que Catalog/Tenants.

## Fase 4 — IA, Smart TV, DRM y escalabilidad

Deliberadamente sin modelar todavía: RecommendationsModule (IA) y DRM/licensing dependen de decisiones no tomadas (proveedor DRM, enfoque de recomendación). Se listan solo para no perder de vista el roadmap — diseñarlos en detalle ahora sería construir sobre requisitos hipotéticos.

## Estado de la base de datos

`backend/bd/schema.prisma` ya cubre por completo la lista de tablas del documento maestro (usuarios, roles, permisos, películas, series, temporadas, episodios, canales, EPG, eventos, suscripciones, planes, pagos, comentarios, historial, favoritos, dispositivos, auditoría, tenants y branding), más las características adicionales mencionadas explícitamente que no eran tablas obvias: `MediaTrack` (subtítulos/audios múltiples), `WatchParty`/`WatchPartyParticipant`, y los flags DVR/Catch-up/TimeShift en `Channel`. Fase 4 (IA/DRM) sigue deliberadamente sin modelar. Los `⬜` en las tablas de arriba son módulos de NestJS sin construir, **no** tablas faltantes.

## Transversales

| Módulo | Estado | Notas |
|---|---|---|
| UsersModule | ⬜ | Gap concreto: hoy solo existe autoregistro (`AuthService.register`). El documento maestro dice explícitamente "Super Administrador puede crear/suspender usuarios" — falta un CRUD admin-facing (`users.manage`/`users.view`). |
| CommentsModule | ⬜ | Tabla `Comment` ya existe. CRUD + moderación (`comments.create`/`comments.moderate`, ya sembrados). |
| AuditModule | ⬜ | No un CRUD completo: un `AuditService` de escritura (llamado desde otros services tras mutaciones sensibles: suspender tenant/usuario, publicar/despublicar) + endpoint de lectura con `audit.view`. |
| AnalyticsModule | ⬜ | Solo lectura/agregación sobre tablas existentes (`Payment`, `Subscription`, `WatchHistory`). Sin schema nuevo. Diseño detallado se difiere a cuando se construya. |

---

## Aislamiento multi-tenant (implementado)

**Problema original**: `JwtStrategy` aplanaba los permisos de todos los `UserRole` del usuario en un único `Set<string>`, perdiendo a qué tenant pertenecía cada rol. `PermissionsGuard` solo verificaba el código de permiso (ej. `content.manage`), nunca si el recurso pertenecía al tenant del usuario. Resultado: cualquier usuario con `content.manage` en un tenant podía crear/editar/eliminar contenido de **cualquier otro tenant**.

**Implementación** (`backend/src/auth/`):

1. `AuthenticatedUser` (`strategies/jwt.strategy.ts`) expone:
   ```ts
   interface AuthenticatedUser {
     id: string;
     email: string;
     tenantId: string | null;
     globalPermissions: string[];               // de UserRole con tenantId = null (ROOT/SUPER_ADMIN)
     tenantPermissions: Record<string, string[]>; // tenantId -> permisos, de UserRole scoped
   }
   ```
2. `PermissionsGuard` (`guards/permissions.guard.ts`) hace el check "grueso": el código de permiso requerido debe estar en la unión de `globalPermissions` + todos los `tenantPermissions` — rechaza rápido, antes de tocar la base de datos.
3. `TenantAccessService` (`tenant-access.service.ts`) hace el check "fino": `assertHasTenantPermission(user, tenantId, permission)` pasa solo si el usuario tiene ese permiso específico globalmente, o dentro de ese tenant exacto. Se llama **dentro de cada service** (no se puede hacer en el guard: no sabe de qué tenant es un recurso arbitrario sin cargarlo primero):
   - En `create`: contra `dto.tenantId`, antes del insert.
   - En `update`/`delete`/`publish`/`archive`: contra el `tenantId` del recurso ya cargado.
4. Cada controller pasa `@CurrentUser()` (`decorators/current-user.decorator.ts`) a los métodos de service que lo necesitan.

Aplicado en `TenantsModule`, `CatalogModule` (Genres/Movies/Series/Seasons/Episodes — estos últimos dos resuelven el tenant vía la serie padre). **Todo módulo nuevo con `tenantId` debe importar `AuthModule` y usar `TenantAccessService` desde el primer commit.**

## Ownership (sin RBAC) en el área de miembro

`Profile`, `Device`, `Favorite`, `WatchHistory`, `DownloadRequest` y `WatchParty` no tienen `tenantId` propio — cuelgan de `User`/`Profile`, no de un tenant. Ninguno de sus módulos usa `PermissionsGuard`/`@Permissions()`: solo `JwtAuthGuard` + un check de pertenencia explícito contra `@CurrentUser().id` antes de leer/escribir. El check vive centralizado en `ProfilesService.assertOwnership(userId, profileId)` (`backend/src/member/profiles/profiles.service.ts`), y `FavoritesModule`/`WatchHistoryModule`/`DownloadsModule`/`PlaybackModule` importan `ProfilesModule` para reusarlo en vez de repetir la query. `WatchPartyModule` es la excepción — no cuelga de `Profile` sino directo de `User` (`hostUserId`), así que compara `party.hostUserId === user.id` inline en el service.

**Todo módulo nuevo scoped a `Profile` debe importar `ProfilesModule` y llamar `assertOwnership` antes de cualquier lectura/escritura** — el mismo criterio que "importar `AuthModule` + `TenantAccessService`" para todo lo que sí tiene `tenantId`.
