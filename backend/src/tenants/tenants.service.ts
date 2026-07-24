import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, TenantStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { UpdateTenantStatusDto } from './dto/update-tenant-status.dto';
import { ResolveTenantDto } from './dto/resolve-tenant.dto';

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateTenantDto) {
    return this.handleUniqueConstraint(() => this.prisma.tenant.create({ data: dto }));
  }

  async findAll(query: PaginationQueryDto) {
    const [data, total] = await Promise.all([
      this.prisma.tenant.findMany({
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.tenant.count(),
    ]);
    return { data, total, page: query.page, limit: query.limit };
  }

  async findOne(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: { branding: true },
    });
    if (!tenant) {
      throw new NotFoundException(`Tenant ${id} not found`);
    }
    return tenant;
  }

  async update(id: string, dto: UpdateTenantDto) {
    await this.findOne(id);
    return this.handleUniqueConstraint(() => this.prisma.tenant.update({ where: { id }, data: dto }));
  }

  async updateStatus(id: string, dto: UpdateTenantStatusDto) {
    await this.findOne(id);
    return this.prisma.tenant.update({ where: { id }, data: { status: dto.status } });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.tenant.delete({ where: { id } });
  }

  // Endpoint público (sin auth): permite al frontend resolver qué tenant sirve
  // un dominio/subdominio antes de saber quién es el usuario.
  async resolvePublic(query: ResolveTenantDto) {
    if (!query.domain && !query.slug) {
      throw new BadRequestException('Provide a domain or slug query param');
    }
    const or: Prisma.TenantWhereInput[] = [];
    if (query.domain) or.push({ domain: query.domain });
    if (query.slug) or.push({ slug: query.slug });

    const tenant = await this.prisma.tenant.findFirst({
      where: { status: TenantStatus.ACTIVE, OR: or },
      include: { branding: true },
    });
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
    return {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      domain: tenant.domain,
      branding: tenant.branding
        ? {
            logoUrl: tenant.branding.logoUrl,
            faviconUrl: tenant.branding.faviconUrl,
            primaryColor: tenant.branding.primaryColor,
            secondaryColor: tenant.branding.secondaryColor,
            themeConfig: tenant.branding.themeConfig,
          }
        : null,
    };
  }

  private async handleUniqueConstraint<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Tenant slug or domain already in use');
      }
      throw error;
    }
  }
}
