import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { handlePrismaWrite } from '../../common/prisma-errors.util';
import { TenantAccessService } from '../../auth/tenant-access.service';
import { AuthenticatedUser } from '../../auth/strategies/jwt.strategy';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';
import { ListChannelsDto } from './dto/list-channels.dto';

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
      slug: query.slug,
      category: query.category,
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
}
