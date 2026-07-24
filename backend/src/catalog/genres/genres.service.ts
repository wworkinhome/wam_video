import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { handlePrismaWrite } from '../../common/prisma-errors.util';
import { TenantAccessService } from '../../auth/tenant-access.service';
import { AuthenticatedUser } from '../../auth/strategies/jwt.strategy';
import { CreateGenreDto } from './dto/create-genre.dto';
import { UpdateGenreDto } from './dto/update-genre.dto';
import { ListGenresDto } from './dto/list-genres.dto';

const CONFLICT_MESSAGE = 'Genre slug already in use for this tenant';

@Injectable()
export class GenresService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantAccess: TenantAccessService,
  ) {}

  create(dto: CreateGenreDto, user: AuthenticatedUser) {
    this.tenantAccess.assertHasTenantPermission(user, dto.tenantId, 'content.manage');
    return handlePrismaWrite(() => this.prisma.genre.create({ data: dto }), CONFLICT_MESSAGE);
  }

  async findAll(query: ListGenresDto) {
    const where: Prisma.GenreWhereInput = query.tenantId ? { tenantId: query.tenantId } : {};
    const [data, total] = await Promise.all([
      this.prisma.genre.findMany({ where, skip: query.skip, take: query.limit, orderBy: { name: 'asc' } }),
      this.prisma.genre.count({ where }),
    ]);
    return { data, total, page: query.page, limit: query.limit };
  }

  async findOne(id: string) {
    const genre = await this.prisma.genre.findUnique({ where: { id } });
    if (!genre) {
      throw new NotFoundException(`Genre ${id} not found`);
    }
    return genre;
  }

  async update(id: string, dto: UpdateGenreDto, user: AuthenticatedUser) {
    const genre = await this.findOne(id);
    this.tenantAccess.assertHasTenantPermission(user, genre.tenantId, 'content.manage');
    return handlePrismaWrite(() => this.prisma.genre.update({ where: { id }, data: dto }), CONFLICT_MESSAGE);
  }

  async remove(id: string, user: AuthenticatedUser) {
    const genre = await this.findOne(id);
    this.tenantAccess.assertHasTenantPermission(user, genre.tenantId, 'content.manage');
    await this.prisma.genre.delete({ where: { id } });
  }
}
