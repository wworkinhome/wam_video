import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { handlePrismaWrite } from '../../common/prisma-errors.util';
import { TenantAccessService } from '../../auth/tenant-access.service';
import { AuthenticatedUser } from '../../auth/strategies/jwt.strategy';
import { CreateEpisodeDto } from './dto/create-episode.dto';
import { UpdateEpisodeDto } from './dto/update-episode.dto';

const CONFLICT_MESSAGE = 'Episode number already exists for this season';

@Injectable()
export class EpisodesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantAccess: TenantAccessService,
  ) {}

  async create(seriesId: string, seasonId: string, dto: CreateEpisodeDto, user: AuthenticatedUser) {
    const season = await this.getSeasonWithTenantOrThrow(seriesId, seasonId);
    this.tenantAccess.assertHasTenantPermission(user, season.series.tenantId, 'content.manage');
    return handlePrismaWrite(
      () =>
        this.prisma.episode.create({
          data: { ...dto, airDate: dto.airDate ? new Date(dto.airDate) : undefined, seasonId },
        }),
      CONFLICT_MESSAGE,
    );
  }

  async findAllPublished(seriesId: string, seasonId: string) {
    await this.ensurePublishedSeasonExists(seriesId, seasonId);
    return this.prisma.episode.findMany({ where: { seasonId }, orderBy: { number: 'asc' } });
  }

  async findOnePublished(seriesId: string, seasonId: string, episodeId: string) {
    await this.ensurePublishedSeasonExists(seriesId, seasonId);
    const episode = await this.prisma.episode.findFirst({ where: { id: episodeId, seasonId } });
    if (!episode) {
      throw new NotFoundException(`Episode ${episodeId} not found`);
    }
    return episode;
  }

  async update(
    seriesId: string,
    seasonId: string,
    episodeId: string,
    dto: UpdateEpisodeDto,
    user: AuthenticatedUser,
  ) {
    const { season } = await this.getEpisodeWithTenantOrThrow(seriesId, seasonId, episodeId);
    this.tenantAccess.assertHasTenantPermission(user, season.series.tenantId, 'content.manage');
    return handlePrismaWrite(
      () =>
        this.prisma.episode.update({
          where: { id: episodeId },
          data: { ...dto, airDate: dto.airDate ? new Date(dto.airDate) : undefined },
        }),
      CONFLICT_MESSAGE,
    );
  }

  async remove(seriesId: string, seasonId: string, episodeId: string, user: AuthenticatedUser) {
    const { season } = await this.getEpisodeWithTenantOrThrow(seriesId, seasonId, episodeId);
    this.tenantAccess.assertHasTenantPermission(user, season.series.tenantId, 'content.manage');
    await this.prisma.episode.delete({ where: { id: episodeId } });
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

  private async getEpisodeWithTenantOrThrow(seriesId: string, seasonId: string, episodeId: string) {
    const season = await this.getSeasonWithTenantOrThrow(seriesId, seasonId);
    const episode = await this.prisma.episode.findFirst({ where: { id: episodeId, seasonId } });
    if (!episode) {
      throw new NotFoundException(`Episode ${episodeId} not found`);
    }
    return { episode, season };
  }

  private async ensurePublishedSeasonExists(seriesId: string, seasonId: string) {
    const season = await this.prisma.season.findFirst({
      where: { id: seasonId, seriesId, series: { status: 'PUBLISHED' } },
    });
    if (!season) {
      throw new NotFoundException(`Season ${seasonId} not found`);
    }
  }
}
