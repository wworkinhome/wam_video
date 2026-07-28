import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../auth/strategies/jwt.strategy';
import { WatchPartyService } from './watch-party.service';
import { CreateWatchPartyDto } from './dto/create-watch-party.dto';

@Controller('watch-parties')
@UseGuards(JwtAuthGuard)
export class WatchPartyController {
  constructor(private readonly watchPartyService: WatchPartyService) {}

  @Post()
  create(@Body() dto: CreateWatchPartyDto, @CurrentUser() user: AuthenticatedUser) {
    return this.watchPartyService.create(user.id, dto);
  }

  @Get('code/:code')
  findByCode(@Param('code') code: string) {
    return this.watchPartyService.findByCode(code);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.watchPartyService.findOne(id);
  }

  @Get(':id/messages')
  listMessages(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.watchPartyService.listMessages(user.id, id);
  }

  @Post(':id/join')
  @HttpCode(HttpStatus.OK)
  join(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.watchPartyService.join(user.id, id);
  }

  @Post(':id/start')
  @HttpCode(HttpStatus.OK)
  start(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.watchPartyService.start(user.id, id);
  }

  @Post(':id/end')
  @HttpCode(HttpStatus.OK)
  end(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.watchPartyService.end(user.id, id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    await this.watchPartyService.remove(user.id, id);
  }
}
