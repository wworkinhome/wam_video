import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../auth/strategies/jwt.strategy';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { FavoritesService } from './favorites.service';
import { CreateFavoriteDto } from './dto/create-favorite.dto';

@Controller('profiles/:profileId/favorites')
@UseGuards(JwtAuthGuard)
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  findAll(
    @Param('profileId') profileId: string,
    @Query() query: PaginationQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.favoritesService.findAll(user.id, profileId, query);
  }

  @Post()
  create(
    @Param('profileId') profileId: string,
    @Body() dto: CreateFavoriteDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.favoritesService.create(user.id, profileId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('profileId') profileId: string,
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.favoritesService.remove(user.id, profileId, id);
  }
}
