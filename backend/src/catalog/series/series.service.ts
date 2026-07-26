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
