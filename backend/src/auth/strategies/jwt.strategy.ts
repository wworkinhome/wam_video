import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

interface JwtPayload {
  sub: string;
  email: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  tenantId: string | null;
  // Permisos de roles sin tenantId (ROOT/SUPER_ADMIN): válidos para cualquier tenant.
  globalPermissions: string[];
  // Permisos de roles scoped a un tenant específico: solo válidos para ese tenant.
  tenantPermissions: Record<string, string[]>;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        roles: {
          include: { role: { include: { permissions: { include: { permission: true } } } } },
        },
      },
    });

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException();
    }

    const globalPermissions = new Set<string>();
    const tenantPermissions: Record<string, Set<string>> = {};

    for (const userRole of user.roles) {
      const codes = userRole.role.permissions.map((rolePermission) => rolePermission.permission.code);
      if (userRole.tenantId === null) {
        codes.forEach((code) => globalPermissions.add(code));
      } else {
        const set = tenantPermissions[userRole.tenantId] ?? (tenantPermissions[userRole.tenantId] = new Set());
        codes.forEach((code) => set.add(code));
      }
    }

    return {
      id: user.id,
      email: user.email,
      tenantId: user.tenantId,
      globalPermissions: Array.from(globalPermissions),
      tenantPermissions: Object.fromEntries(
        Object.entries(tenantPermissions).map(([tenantId, codes]) => [tenantId, Array.from(codes)]),
      ),
    };
  }
}
