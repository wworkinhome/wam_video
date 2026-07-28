import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { handlePrismaWrite } from '../../common/prisma-errors.util';
import { TenantAccessService } from '../../auth/tenant-access.service';
import { AuthenticatedUser } from '../../auth/strategies/jwt.strategy';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';
import { ListChannelsDto } from './dto/list-channels.dto';
import { ImportChannelsDto } from './dto/import-channels.dto';
import { parseM3U, slugifyChannelName } from './m3u-parser';

const CONFLICT_MESSAGE = 'Channel slug already in use for this tenant';

@Injectable()
export class ChannelsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantAccess: TenantAccessService,
  ) {}

  create(dto: CreateChannelDto, user: AuthenticatedUser) {
    this.tenantAccess.assertHasTenantPermission(user, dto.tenantId, 'channels.manage');
    return handlePrismaWrite(() => this.prisma.channel.create({ data: dto }), CONFLICT_MESSAGE);
  }

  async findAll(query: ListChannelsDto) {
    const where: Prisma.ChannelWhereInput = {
      tenantId: query.tenantId,
      slug: query.slugs && query.slugs.length > 0 ? { in: query.slugs } : query.slug,
      category: query.category,
      country: query.country,
      name: query.q ? { contains: query.q, mode: 'insensitive' } : undefined,
      streamStatus: query.status === 'unchecked' ? null : query.status,
    };
    const [data, total] = await Promise.all([
      this.prisma.channel.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.channel.count({ where }),
    ]);
    return { data, total, page: query.page, limit: query.limit };
  }

  async findOne(id: string) {
    const channel = await this.prisma.channel.findUnique({ where: { id } });
    if (!channel) {
      throw new NotFoundException(`Channel ${id} not found`);
    }
    return channel;
  }

  async update(id: string, dto: UpdateChannelDto, user: AuthenticatedUser) {
    const channel = await this.findOne(id);
    this.tenantAccess.assertHasTenantPermission(user, channel.tenantId, 'channels.manage');
    return handlePrismaWrite(() => this.prisma.channel.update({ where: { id }, data: dto }), CONFLICT_MESSAGE);
  }

  async remove(id: string, user: AuthenticatedUser) {
    const channel = await this.findOne(id);
    this.tenantAccess.assertHasTenantPermission(user, channel.tenantId, 'channels.manage');
    await this.prisma.channel.delete({ where: { id } });
  }

  // Bulk import desde una playlist M3U pegada a mano en el admin (o generada por el
  // script de iptv-org — ver backend/scripts/import-iptv-channels.js). Por nombre/slug:
  // si ya existe un canal con ese slug en el tenant, actualiza su streamUrl/logo/categoría
  // en vez de duplicarlo, así se puede re-pegar la misma lista para refrescar URLs vencidas.
  async importFromM3U(dto: ImportChannelsDto, user: AuthenticatedUser) {
    this.tenantAccess.assertHasTenantPermission(user, dto.tenantId, 'channels.manage');
    const parsed = parseM3U(dto.m3u);

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const item of parsed) {
      if (!item.streamUrl) {
        skipped++;
        continue;
      }
      const slug = slugifyChannelName(item.name);
      try {
        const existing = await this.prisma.channel.findFirst({ where: { tenantId: dto.tenantId, slug } });
        if (existing) {
          await this.prisma.channel.update({
            where: { id: existing.id },
            data: {
              streamUrl: item.streamUrl,
              logoUrl: item.logoUrl ?? existing.logoUrl,
              category: item.category ?? existing.category,
            },
          });
          updated++;
        } else {
          await this.prisma.channel.create({
            data: {
              tenantId: dto.tenantId,
              name: item.name,
              slug,
              streamUrl: item.streamUrl,
              logoUrl: item.logoUrl,
              category: item.category,
            },
          });
          created++;
        }
      } catch {
        skipped++;
      }
    }

    return { total: parsed.length, created, updated, skipped };
  }
}
