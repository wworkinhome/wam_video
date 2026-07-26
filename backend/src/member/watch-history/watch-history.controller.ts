import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../auth/strategies/jwt.strategy';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { WatchHistoryService } from './watch-history.service';

@Controller('profiles/:profileId/continue-watching')
@UseGuards(JwtAuthGuard)
export class WatchHistoryController {
  constructor(private readonly watchHistoryService: WatchHistoryService) {}

  @Get()
  findAll(
    @Param('profileId') profileId: string,
    @Query() query: PaginationQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.watchHistoryService.findContinueWatching(user.id, profileId, query);
  }

  // Progreso de un movie/episode puntual, para que el reproductor reanude donde quedó.
  @Get('progress')
  findProgress(
    @Param('profileId') profileId: string,
    @Query('movieId') movieId: string | undefined,
    @Query('episodeId') episodeId: string | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.watchHistoryService.findProgress(user.id, profileId, { movieId, episodeId });
  }
}
