import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { TenantStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthenticatedUser } from './strategies/jwt.strategy';

// Rol asignado a cuentas nuevas cuando no se especifica uno (ver prisma/seed.ts).
const DEFAULT_ROLE_NAME = 'STANDARD_USER';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    if (dto.tenantId) {
      const tenant = await this.prisma.tenant.findUnique({ where: { id: dto.tenantId } });
      if (!tenant || tenant.status !== TenantStatus.ACTIVE) {
        throw new BadRequestException('Invalid tenant');
      }
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        name: dto.name,
        tenantId: dto.tenantId,
        status: 'ACTIVE',
      },
    });

    const defaultRole = await this.prisma.role.findUnique({ where: { name: DEFAULT_ROLE_NAME } });
    if (defaultRole) {
      await this.prisma.userRole.create({
        data: { userId: user.id, roleId: defaultRole.id, tenantId: dto.tenantId },
      });
    }

    return this.signToken(user.id, user.email);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.signToken(user.id, user.email);
  }

  async me(user: AuthenticatedUser) {
    const dbUser = await this.prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      include: { tenant: true },
    });
    return {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      avatarUrl: dbUser.avatarUrl,
      status: dbUser.status,
      tenant: dbUser.tenant ? { id: dbUser.tenant.id, name: dbUser.tenant.name, slug: dbUser.tenant.slug } : null,
      globalPermissions: user.globalPermissions,
      tenantPermissions: user.tenantPermissions,
    };
  }

  private signToken(userId: string, email: string) {
    return { accessToken: this.jwtService.sign({ sub: userId, email }) };
  }
}
