import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../auth/strategies/jwt.strategy';
import { SeasonsService } from './seasons.service';
import { CreateSeasonDto } from './dto/create-season.dto';
import { UpdateSeasonDto } from './dto/update-season.dto';

@Controller('series/:seriesId/seasons')
export class SeasonsController {
  constructor(private readonly seasonsService: SeasonsService) {}

  @Get()
  findAll(@Param('seriesId') seriesId: string) {
    return this.seasonsService.findAllPublished(seriesId);
  }

  @Get(':seasonId')
  findOne(@Param('seriesId') seriesId: string, @Param('seasonId') seasonId: string) {
    return this.seasonsService.findOnePublished(seriesId, seasonId);
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('content.manage')
  create(
    @Param('seriesId') seriesId: string,
    @Body() dto: CreateSeasonDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.seasonsService.create(seriesId, dto, user);
  }

  @Patch(':seasonId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('content.manage')
  update(
    @Param('seriesId') seriesId: string,
    @Param('seasonId') seasonId: string,
    @Body() dto: UpdateSeasonDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.seasonsService.update(seriesId, seasonId, dto, user);
  }

  @Delete(':seasonId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('content.manage')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('seriesId') seriesId: string,
    @Param('seasonId') seasonId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.seasonsService.remove(seriesId, seasonId, user);
  }
}
