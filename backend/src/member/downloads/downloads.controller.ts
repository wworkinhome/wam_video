import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../auth/strategies/jwt.strategy';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { DownloadsService } from './downloads.service';
import { CreateDownloadDto } from './dto/create-download.dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class DownloadsController {
  constructor(private readonly downloadsService: DownloadsService) {}

  @Get('profiles/:profileId/downloads')
  findAll(
    @Param('profileId') profileId: string,
    @Query() query: PaginationQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.downloadsService.findAll(user.id, profileId, query);
  }

  @Post('profiles/:profileId/downloads')
  create(
    @Param('profileId') profileId: string,
    @Body() dto: CreateDownloadDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.downloadsService.create(user.id, profileId, dto);
  }

  @Patch('downloads/:id/revoke')
  @HttpCode(HttpStatus.OK)
  revoke(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.downloadsService.revoke(user.id, id);
  }

  @Delete('downloads/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    await this.downloadsService.remove(user.id, id);
  }
}
