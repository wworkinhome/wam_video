import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../auth/strategies/jwt.strategy';
import { EpisodesService } from './episodes.service';
import { CreateEpisodeDto } from './dto/create-episode.dto';
import { UpdateEpisodeDto } from './dto/update-episode.dto';

@Controller('series/:seriesId/seasons/:seasonId/episodes')
export class EpisodesController {
  constructor(private readonly episodesService: EpisodesService) {}

  @Get()
  findAll(@Param('seriesId') seriesId: string, @Param('seasonId') seasonId: string) {
    return this.episodesService.findAllPublished(seriesId, seasonId);
  }

  @Get(':episodeId')
  findOne(
    @Param('seriesId') seriesId: string,
    @Param('seasonId') seasonId: string,
    @Param('episodeId') episodeId: string,
  ) {
    return this.episodesService.findOnePublished(seriesId, seasonId, episodeId);
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('content.manage')
  create(
    @Param('seriesId') seriesId: string,
    @Param('seasonId') seasonId: string,
    @Body() dto: CreateEpisodeDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.episodesService.create(seriesId, seasonId, dto, user);
  }

  @Patch(':episodeId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('content.manage')
  update(
    @Param('seriesId') seriesId: string,
    @Param('seasonId') seasonId: string,
    @Param('episodeId') episodeId: string,
    @Body() dto: UpdateEpisodeDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.episodesService.update(seriesId, seasonId, episodeId, dto, user);
  }

  @Delete(':episodeId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('content.manage')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('seriesId') seriesId: string,
    @Param('seasonId') seasonId: string,
    @Param('episodeId') episodeId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.episodesService.remove(seriesId, seasonId, episodeId, user);
  }
}
