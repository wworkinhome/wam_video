import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ContentStatus, SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantAccessService } from '../../auth/tenant-access.service';
import { AuthenticatedUser } from '../../auth/strategies/jwt.strategy';
import { ProfilesService } from '../profiles/profiles.service';
import { WatchHistoryService } from '../watch-history/watch-history.service';
import { PlaybackHeartbeatDto } from './dto/playback-heartbeat.dto';

const ENTITLEMENT_MESSAGE = 'An active subscription is required to watch this content';

@Injectable()
export class PlaybackService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantAccess: TenantAccessService,
    private readonly profilesService: ProfilesService,
    private readonly watchHistoryService: WatchHistoryService,
  ) {}

  async getMoviePlayback(user: AuthenticatedUser, movieId: string) {
    const movie = await this.prisma.movie.findFirst({ where: { id: movieId, status: ContentStatus.PUBLISHED } });
    if (!movie) {
      throw new NotFoundException(`Movie ${movieId} not found`);
    }
    const isStaff = this.tenantAccess.hasTenantPermission(user, movie.tenantId, 'content.manage');
    if (movie.isPremium && !isStaff && !(await this.hasActiveSubscription(user.id))) {
      throw new ForbiddenException(ENTITLEMENT_MESSAGE);
    }
    const mediaTracks = await this.prisma.mediaTrack.findMany({ where: { movieId } });
    return {
      id: movie.id,
      title: movie.title,
      videoUrl: movie.videoUrl,
      durationMinutes: movie.durationMinutes,
      mediaTracks,
    };
  }

  async getEpisodePlayback(user: AuthenticatedUser, episodeId: string) {
    const episode = await this.prisma.episode.findFirst({
      where: { id: episodeId, season: { series: { status: ContentStatus.PUBLISHED } } },
      include: { season: { include: { series: true } } },
    });
    if (!episode) {
      throw new NotFoundException(`Episode ${episodeId} not found`);
    }
    const isStaff = this.tenantAccess.hasTenantPermission(user, episode.season.series.tenantId, 'content.manage');
    if (episode.season.series.isPremium && !isStaff && !(await this.hasActiveSubscription(user.id))) {
      throw new ForbiddenException(ENTITLEMENT_MESSAGE);
    }
    const mediaTracks = await this.prisma.mediaTrack.findMany({ where: { episodeId } });
    return {
      id: episode.id,
      title: episode.title,
      videoUrl: episode.videoUrl,
      durationMinutes: episode.durationMinutes,
      mediaTracks,
    };
  }

  async heartbeat(userId: string, dto: PlaybackHeartbeatDto) {
    await this.profilesService.assertOwnership(userId, dto.profileId);
    return this.watchHistoryService.upsertProgress(dto.profileId, {
      movieId: dto.movieId,
      episodeId: dto.episodeId,
      progressSeconds: dto.progressSeconds,
      durationSeconds: dto.durationSeconds,
      completed: dto.completed,
    });
  }

  // SubscriptionsModule (Fase 2) todavía no existe como flujo de autoservicio, pero la
  // tabla Subscription ya está en el schema — el gate de entitlement se apoya en ella
  // directamente en vez de esperar a que se construya todo el módulo de suscripciones.
  private async hasActiveSubscription(userId: string): Promise<boolean> {
    const count = await this.prisma.subscription.count({
      where: { userId, status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING] } },
    });
    return count > 0;
  }
}
