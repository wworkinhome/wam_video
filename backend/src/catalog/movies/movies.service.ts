import { Injectable, NotFoundException } from '@nestjs/common';
import { ContentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { handlePrismaWrite } from '../../common/prisma-errors.util';
import { TenantAccessService } from '../../auth/tenant-access.service';
import { AuthenticatedUser } from '../../auth/strategies/jwt.strategy';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { ListMoviesDto } from './dto/list-movies.dto';

const MOVIE_INCLUDE = { genres: { include: { genre: true } } } satisfies Prisma.MovieInclude;
const CONFLICT_MESSAGE = 'Movie slug already in use for this tenant';

@Injectable()
export class MoviesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantAccess: TenantAccessService,
  ) {}

  create(dto: CreateMovieDto, user: AuthenticatedUser) {
    this.tenantAccess.assertHasTenantPermission(user, dto.tenantId, 'content.manage');
    const { genreIds, ...data } = dto;
    return handlePrismaWrite(
      () =>
        this.prisma.movie.create({
          data: {
            ...data,
            genres: genreIds ? { create: genreIds.map((genreId) => ({ genreId })) } : undefined,
          },
          include: MOVIE_INCLUDE,
        }),
      CONFLICT_MESSAGE,
    );
  }

  async findAllPublished(query: ListMoviesDto) {
    const where: Prisma.MovieWhereInput = {
      status: ContentStatus.PUBLISHED,
      tenantId: query.tenantId,
      genres: query.genreId ? { some: { genreId: query.genreId } } : undefined,
    };
    const [data, total] = await Promise.all([
      this.prisma.movie.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        include: MOVIE_INCLUDE,
      }),
      this.prisma.movie.count({ where }),
    ]);
    return { data, total, page: query.page, limit: query.limit };
  }

  async findOnePublished(id: string) {
    const movie = await this.prisma.movie.findFirst({
      where: { id, status: ContentStatus.PUBLISHED },
      include: MOVIE_INCLUDE,
    });
    if (!movie) {
      throw new NotFoundException(`Movie ${id} not found`);
    }
    return movie;
  }

  async update(id: string, dto: UpdateMovieDto, user: AuthenticatedUser) {
    const movie = await this.findByIdOrThrow(id);
    this.tenantAccess.assertHasTenantPermission(user, movie.tenantId, 'content.manage');
    const { genreIds, ...data } = dto;

    return handlePrismaWrite(
      () =>
        this.prisma.$transaction(async (tx) => {
          if (genreIds) {
            await tx.movieGenre.deleteMany({ where: { movieId: id } });
            if (genreIds.length > 0) {
              await tx.movieGenre.createMany({ data: genreIds.map((genreId) => ({ movieId: id, genreId })) });
            }
          }
          return tx.movie.update({ where: { id }, data, include: MOVIE_INCLUDE });
        }),
      CONFLICT_MESSAGE,
    );
  }

  async publish(id: string, user: AuthenticatedUser) {
    const movie = await this.findByIdOrThrow(id);
    this.tenantAccess.assertHasTenantPermission(user, movie.tenantId, 'content.publish');
    return this.prisma.movie.update({ where: { id }, data: { status: ContentStatus.PUBLISHED } });
  }

  async archive(id: string, user: AuthenticatedUser) {
    const movie = await this.findByIdOrThrow(id);
    this.tenantAccess.assertHasTenantPermission(user, movie.tenantId, 'content.publish');
    return this.prisma.movie.update({ where: { id }, data: { status: ContentStatus.ARCHIVED } });
  }

  async remove(id: string, user: AuthenticatedUser) {
    const movie = await this.findByIdOrThrow(id);
    this.tenantAccess.assertHasTenantPermission(user, movie.tenantId, 'content.manage');
    await this.prisma.movie.delete({ where: { id } });
  }

  private async findByIdOrThrow(id: string) {
    const movie = await this.prisma.movie.findUnique({ where: { id } });
    if (!movie) {
      throw new NotFoundException(`Movie ${id} not found`);
    }
    return movie;
  }
}
