import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { handlePrismaWrite } from '../../common/prisma-errors.util';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { ProfilesService } from '../profiles/profiles.service';

export interface UpsertWatchHistoryInput {
  movieId?: string;
  episodeId?: string;
  progressSeconds: number;
  durationSeconds?: number;
  completed?: boolean;
}

const CONFLICT_MESSAGE = 'Invalid movie or episode reference';

@Injectable()
export class WatchHistoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly profilesService: ProfilesService,
  ) {}

  async findContinueWatching(userId: string, profileId: string, query: PaginationQueryDto) {
    await this.profilesService.assertOwnership(userId, profileId);
    const where: Prisma.WatchHistoryWhereInput = { profileId, completed: false };
    const [data, total] = await Promise.all([
      this.prisma.watchHistory.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { updatedAt: 'desc' },
        include: { movie: true, episode: { include: { season: { include: { series: true } } } } },
      }),
      this.prisma.watchHistory.count({ where }),
    ]);
    return { data, total, page: query.page, limit: query.limit };
  }

  // Progreso guardado de UN movie/episode puntual (para reanudar el reproductor donde
  // quedó, sin tener que traer toda la lista de "continuar viendo").
  async findProgress(userId: string, profileId: string, input: { movieId?: string; episodeId?: string }) {
    this.assertExactlyOne(input);
    await this.profilesService.assertOwnership(userId, profileId);
    return this.prisma.watchHistory.findFirst({
      where: { profileId, movieId: input.movieId ?? null, episodeId: input.episodeId ?? null },
    });
  }

  // Llamado desde PlaybackModule en cada heartbeat del reproductor. No valida
  // ownership del profileId — eso ya lo hizo PlaybackService antes de llamar aquí.
  async upsertProgress(profileId: string, input: UpsertWatchHistoryInput) {
    this.assertExactlyOne(input);

    // Mismo caveat que Favorite: @@unique no cubre FKs nulas, se busca antes de insertar.
    const existing = await this.prisma.watchHistory.findFirst({
      where: { profileId, movieId: input.movieId ?? null, episodeId: input.episodeId ?? null },
    });
    const data = {
      progressSeconds: input.progressSeconds,
      durationSeconds: input.durationSeconds,
      completed: input.completed ?? false,
    };

    if (existing) {
      return this.prisma.watchHistory.update({ where: { id: existing.id }, data });
    }
    return handlePrismaWrite(
      () =>
        this.prisma.watchHistory.create({
          data: { profileId, movieId: input.movieId, episodeId: input.episodeId, ...data },
        }),
      CONFLICT_MESSAGE,
    );
  }

  private assertExactlyOne(input: { movieId?: string; episodeId?: string }) {
    const count = [input.movieId, input.episodeId].filter(Boolean).length;
    if (count !== 1) {
      throw new BadRequestException('Provide exactly one of movieId or episodeId');
    }
  }
}
