import { ForbiddenException, Injectable } from '@nestjs/common';
import { AuthenticatedUser } from './strategies/jwt.strategy';

@Injectable()
export class TenantAccessService {
  // Verifica que el usuario tenga `permission` para el tenant indicado: ya sea
  // porque lo tiene globalmente (ROOT/SUPER_ADMIN) o porque su rol en ESE tenant lo incluye.
  // PermissionsGuard ya comprobó que el usuario tiene `permission` en ALGÚN tenant;
  // esta verificación es la que impide que aplique a un tenant que no es el suyo.
  assertHasTenantPermission(user: AuthenticatedUser, tenantId: string, permission: string): void {
    if (user.globalPermissions.includes(permission)) {
      return;
    }
    if (user.tenantPermissions[tenantId]?.includes(permission)) {
      return;
    }
    throw new ForbiddenException(`Missing permission "${permission}" for this tenant`);
  }
}
