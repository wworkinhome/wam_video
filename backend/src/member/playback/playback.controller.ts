import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../auth/strategies/jwt.strategy';
import { PlaybackService } from './playback.service';
import { PlaybackHeartbeatDto } from './dto/playback-heartbeat.dto';

@Controller('playback')
@UseGuards(JwtAuthGuard)
export class PlaybackController {
  constructor(private readonly playbackService: PlaybackService) {}

  @Get('movies/:movieId')
  getMovie(@Param('movieId') movieId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.playbackService.getMoviePlayback(user, movieId);
  }

  @Get('episodes/:episodeId')
  getEpisode(@Param('episodeId') episodeId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.playbackService.getEpisodePlayback(user, episodeId);
  }

  @Post('heartbeat')
  @HttpCode(HttpStatus.OK)
  heartbeat(@Body() dto: PlaybackHeartbeatDto, @CurrentUser() user: AuthenticatedUser) {
    return this.playbackService.heartbeat(user.id, dto);
  }
}
