import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { handlePrismaWrite } from '../../common/prisma-errors.util';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { ProfilesService } from '../profiles/profiles.service';
import { CreateFavoriteDto } from './dto/create-favorite.dto';

const CONFLICT_MESSAGE = 'Invalid movie or series reference';

@Injectable()
export class FavoritesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly profilesService: ProfilesService,
  ) {}

  async findAll(userId: string, profileId: string, query: PaginationQueryDto) {
    await this.profilesService.assertOwnership(userId, profileId);
    const where = { profileId };
    const [data, total] = await Promise.all([
      this.prisma.favorite.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        include: { movie: true, series: true },
      }),
      this.prisma.favorite.count({ where }),
    ]);
    return { data, total, page: query.page, limit: query.limit };
  }

  async create(userId: string, profileId: string, dto: CreateFavoriteDto) {
    await this.profilesService.assertOwnership(userId, profileId);
    this.assertExactlyOne(dto);

    // Postgres no compara NULL = NULL, así que @@unique([profileId, movieId, seriesId])
    // no evita duplicados por sí solo (ver nota en schema.prisma) — se busca antes de insertar.
    const existing = await this.prisma.favorite.findFirst({
      where: { profileId, movieId: dto.movieId ?? null, seriesId: dto.seriesId ?? null },
    });
    if (existing) {
      return existing;
    }

    return handlePrismaWrite(
      () => this.prisma.favorite.create({ data: { profileId, movieId: dto.movieId, seriesId: dto.seriesId } }),
      CONFLICT_MESSAGE,
    );
  }

  async remove(userId: string, profileId: string, id: string) {
    await this.profilesService.assertOwnership(userId, profileId);
    const favorite = await this.prisma.favorite.findFirst({ where: { id, profileId } });
    if (!favorite) {
      throw new NotFoundException(`Favorite ${id} not found`);
    }
    await this.prisma.favorite.delete({ where: { id } });
  }

  private assertExactlyOne(dto: CreateFavoriteDto) {
    const count = [dto.movieId, dto.seriesId].filter(Boolean).length;
    if (count !== 1) {
      throw new BadRequestException('Provide exactly one of movieId or seriesId');
    }
  }
}
