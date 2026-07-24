import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { handlePrismaWrite } from '../../common/prisma-errors.util';
import { TenantAccessService } from '../../auth/tenant-access.service';
import { AuthenticatedUser } from '../../auth/strategies/jwt.strategy';
import { CreateSeasonDto } from './dto/create-season.dto';
import { UpdateSeasonDto } from './dto/update-season.dto';

const CONFLICT_MESSAGE = 'Season number already exists for this series';

@Injectable()
export class SeasonsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantAccess: TenantAccessService,
  ) {}

  async create(seriesId: string, dto: CreateSeasonDto, user: AuthenticatedUser) {
    const series = await this.getSeriesOrThrow(seriesId);
    this.tenantAccess.assertHasTenantPermission(user, series.tenantId, 'content.manage');
    return handlePrismaWrite(
      () => this.prisma.season.create({ data: { ...dto, seriesId } }),
      CONFLICT_MESSAGE,
    );
  }

  async findAllPublished(seriesId: string) {
    await this.ensurePublishedSeriesExists(seriesId);
    return this.prisma.season.findMany({ where: { seriesId }, orderBy: { number: 'asc' } });
  }

  async findOnePublished(seriesId: string, seasonId: string) {
    const season = await this.prisma.season.findFirst({
      where: { id: seasonId, seriesId, series: { status: 'PUBLISHED' } },
    });
    if (!season) {
      throw new NotFoundException(`Season ${seasonId} not found`);
    }
    return season;
  }

  async update(seriesId: string, seasonId: string, dto: UpdateSeasonDto, user: AuthenticatedUser) {
    const season = await this.getSeasonWithTenantOrThrow(seriesId, seasonId);
    this.tenantAccess.assertHasTenantPermission(user, season.series.tenantId, 'content.manage');
    return handlePrismaWrite(
      () => this.prisma.season.update({ where: { id: seasonId }, data: dto }),
      CONFLICT_MESSAGE,
    );
  }

  async remove(seriesId: string, seasonId: string, user: AuthenticatedUser) {
    const season = await this.getSeasonWithTenantOrThrow(seriesId, seasonId);
    this.tenantAccess.assertHasTenantPermission(user, season.series.tenantId, 'content.manage');
    await this.prisma.season.delete({ where: { id: seasonId } });
  }

  private async getSeriesOrThrow(seriesId: string) {
    const series = await this.prisma.series.findUnique({ where: { id: seriesId } });
    if (!series) {
      throw new NotFoundException(`Series ${seriesId} not found`);
    }
    return series;
  }

  private async getSeasonWithTenantOrThrow(seriesId: string, seasonId: string) {
    const season = await this.prisma.season.findFirst({
      where: { id: seasonId, seriesId },
      include: { series: { select: { tenantId: true } } },
    });
    if (!season) {
      throw new NotFoundException(`Season ${seasonId} not found`);
    }
    return season;
  }

  private async ensurePublishedSeriesExists(seriesId: string) {
    const series = await this.prisma.series.findFirst({ where: { id: seriesId, status: 'PUBLISHED' } });
    if (!series) {
      throw new NotFoundException(`Series ${seriesId} not found`);
    }
  }
}
