import { Injectable, NotFoundException } from '@nestjs/common';
import { ContentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { handlePrismaWrite } from '../../common/prisma-errors.util';
import { TenantAccessService } from '../../auth/tenant-access.service';
import { AuthenticatedUser } from '../../auth/strategies/jwt.strategy';
import { CreateSeriesDto } from './dto/create-series.dto';
import { UpdateSeriesDto } from './dto/update-series.dto';
import { ListSeriesDto } from './dto/list-series.dto';

const SERIES_LIST_INCLUDE = {
  genres: { include: { genre: true } },
  // Un episodio "muestra" liviano para poder usar su video como preview/trailer en el hero.
  seasons: { take: 1, orderBy: { number: 'asc' }, include: { episodes: { take: 1, orderBy: { number: 'asc' } } } },
} satisfies Prisma.SeriesInclude;

const SERIES_DETAIL_INCLUDE = {
  genres: { include: { genre: true } },
  seasons: { orderBy: { number: 'asc' }, include: { episodes: { orderBy: { number: 'asc' } } } },
} satisfies Prisma.SeriesInclude;

const CONFLICT_MESSAGE = 'Series slug already in use for this tenant';

@Injectable()
export class SeriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantAccess: TenantAccessService,
  ) {}

  create(dto: CreateSeriesDto, user: AuthenticatedUser) {
    this.tenantAccess.assertHasTenantPermission(user, dto.tenantId, 'content.manage');
    const { genreIds, ...data } = dto;
    return handlePrismaWrite(
      () =>
        this.prisma.series.create({
          data: {
            ...data,
            genres: genreIds ? { create: genreIds.map((genreId) => ({ genreId })) } : undefined,
          },
          include: SERIES_LIST_INCLUDE,
          relationLoadStrategy: 'join',
        }),
      CONFLICT_MESSAGE,
    );
  }

  async findAllPublished(query: ListSeriesDto) {
    const where: Prisma.SeriesWhereInput = {
      status: ContentStatus.PUBLISHED,
      tenantId: query.tenantId,
      slug: query.slug,
      genres: query.genreId ? { some: { genreId: query.genreId } } : undefined,
      title: query.q ? { contains: query.q, mode: 'insensitive' } : undefined,
      category: query.category,
      isKids: query.isKids,
    };
    const [data, total] = await Promise.all([
      this.prisma.series.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        include: SERIES_LIST_INCLUDE,
        relationLoadStrategy: 'join',
      }),
      this.prisma.series.count({ where }),
    ]);
    return { data, total, page: query.page, limit: query.limit };
  }

  // Para el CMS de admin: sin filtrar por status, e incluye seasons/episodes
  // para poder gestionarlos desde la pantalla de edición.
  async findAllForAdmin(query: ListSeriesDto, user: AuthenticatedUser) {
    if (query.tenantId) {
      this.tenantAccess.assertHasTenantPermission(user, query.tenantId, 'content.manage');
    }
    const where: Prisma.SeriesWhereInput = {
      tenantId: query.tenantId,
      slug: query.slug,
      genres: query.genreId ? { some: { genreId: query.genreId } } : undefined,
      title: query.q ? { contains: query.q, mode: 'insensitive' } : undefined,
      category: query.category,
      isKids: query.isKids,
    };
    const [data, total] = await Promise.all([
      this.prisma.series.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        include: SERIES_LIST_INCLUDE,
        relationLoadStrategy: 'join',
      }),
      this.prisma.series.count({ where }),
    ]);
    return { data, total, page: query.page, limit: query.limit };
  }

  async findOneForAdmin(id: string, user: AuthenticatedUser) {
    const series = await this.findByIdOrThrow(id);
    this.tenantAccess.assertHasTenantPermission(user, series.tenantId, 'content.manage');
    return this.prisma.series.findUnique({
      where: { id },
      include: SERIES_DETAIL_INCLUDE,
      relationLoadStrategy: 'join',
    });
  }

  // "Top 10" estilo Netflix: rankea por actividad real de WatchHistory (no hay
  // datos de popularidad por país, así que es "más vistas en la plataforma", no
  // una simulación de un feed regional). WatchHistory solo referencia episodeId,
  // así que se agrupa por episodio y se suma por serie en memoria. Si todavía no
  // hay historial (instalación nueva) o faltan series para completar el límite,
  // se rellena con lo más reciente — mismo fallback que usa RecommendationsService.
  async findPopular(tenantId: string | undefined, isKids: boolean | undefined, limit: number) {
    const grouped = await this.prisma.watchHistory.groupBy({
      by: ['episodeId'],
      where: { episodeId: { not: null } },
      _count: { episodeId: true },
    });

    const countBySeriesId = new Map<string, number>();
    if (grouped.length > 0) {
      const episodeIds = grouped.map((g) => g.episodeId as string);
      const episodeCount = new Map(grouped.map((g) => [g.episodeId as string, g._count.episodeId]));
      const episodes = await this.prisma.episode.findMany({
        where: { id: { in: episodeIds } },
        select: {
          id: true,
          season: { select: { seriesId: true, series: { select: { tenantId: true, status: true, isKids: true } } } },
        },
      });

      for (const episode of episodes) {
        const series = episode.season?.series;
        const seriesId = episode.season?.seriesId;
        if (!series || !seriesId || series.status !== ContentStatus.PUBLISHED) continue;
        if (tenantId && series.tenantId !== tenantId) continue;
        if (isKids !== undefined && series.isKids !== isKids) continue;
        countBySeriesId.set(seriesId, (countBySeriesId.get(seriesId) ?? 0) + (episodeCount.get(episode.id) ?? 0));
      }
    }

    const rankedIds = [...countBySeriesId.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([id]) => id);

    const ranked: Prisma.SeriesGetPayload<{ include: typeof SERIES_LIST_INCLUDE }>[] = [];
    if (rankedIds.length > 0) {
      const series = await this.prisma.series.findMany({
        where: { id: { in: rankedIds } },
        include: SERIES_LIST_INCLUDE,
        relationLoadStrategy: 'join',
      });
      const byId = new Map(series.map((s) => [s.id, s]));
      for (const id of rankedIds) {
        const match = byId.get(id);
        if (match) ranked.push(match);
      }
    }

    if (ranked.length < limit) {
      const filler = await this.prisma.series.findMany({
        where: {
          tenantId,
          status: ContentStatus.PUBLISHED,
          isKids,
          id: { notIn: ranked.map((s) => s.id) },
        },
        take: limit - ranked.length,
        orderBy: { createdAt: 'desc' },
        include: SERIES_LIST_INCLUDE,
        relationLoadStrategy: 'join',
      });
      ranked.push(...filler);
    }

    return ranked;
  }

  async findOnePublished(id: string) {
    const series = await this.prisma.series.findFirst({
      where: { id, status: ContentStatus.PUBLISHED },
      include: SERIES_DETAIL_INCLUDE,
      relationLoadStrategy: 'join',
    });
    if (!series) {
      throw new NotFoundException(`Series ${id} not found`);
    }
    return series;
  }

  async update(id: string, dto: UpdateSeriesDto, user: AuthenticatedUser) {
    const series = await this.findByIdOrThrow(id);
    this.tenantAccess.assertHasTenantPermission(user, series.tenantId, 'content.manage');
    const { genreIds, ...data } = dto;

    return handlePrismaWrite(
      () =>
        this.prisma.$transaction(async (tx) => {
          if (genreIds) {
            await tx.seriesGenre.deleteMany({ where: { seriesId: id } });
            if (genreIds.length > 0) {
              await tx.seriesGenre.createMany({ data: genreIds.map((genreId) => ({ seriesId: id, genreId })) });
            }
          }
          return tx.series.update({ where: { id }, data, include: SERIES_LIST_INCLUDE, relationLoadStrategy: 'join' });
        }),
      CONFLICT_MESSAGE,
    );
  }

  async publish(id: string, user: AuthenticatedUser) {
    const series = await this.findByIdOrThrow(id);
    this.tenantAccess.assertHasTenantPermission(user, series.tenantId, 'content.publish');
    return this.prisma.series.update({ where: { id }, data: { status: ContentStatus.PUBLISHED } });
  }

  async archive(id: string, user: AuthenticatedUser) {
    const series = await this.findByIdOrThrow(id);
    this.tenantAccess.assertHasTenantPermission(user, series.tenantId, 'content.publish');
    return this.prisma.series.update({ where: { id }, data: { status: ContentStatus.ARCHIVED } });
  }

  async remove(id: string, user: AuthenticatedUser) {
    const series = await this.findByIdOrThrow(id);
    this.tenantAccess.assertHasTenantPermission(user, series.tenantId, 'content.manage');
    await this.prisma.series.delete({ where: { id } });
  }

  private async findByIdOrThrow(id: string) {
    const series = await this.prisma.series.findUnique({ where: { id } });
    if (!series) {
      throw new NotFoundException(`Series ${id} not found`);
    }
    return series;
  }
}
