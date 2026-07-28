import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../auth/strategies/jwt.strategy';
import { ChannelsService } from './channels.service';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';
import { ListChannelsDto } from './dto/list-channels.dto';
import { ImportChannelsDto } from './dto/import-channels.dto';

@Controller('channels')
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) {}

  @Get()
  findAll(@Query() query: ListChannelsDto) {
    return this.channelsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.channelsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('channels.manage')
  create(@Body() dto: CreateChannelDto, @CurrentUser() user: AuthenticatedUser) {
    return this.channelsService.create(dto, user);
  }

  @Post('import')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('channels.manage')
  importFromM3U(@Body() dto: ImportChannelsDto, @CurrentUser() user: AuthenticatedUser) {
    return this.channelsService.importFromM3U(dto, user);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('channels.manage')
  update(@Param('id') id: string, @Body() dto: UpdateChannelDto, @CurrentUser() user: AuthenticatedUser) {
    return this.channelsService.update(id, dto, user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('channels.manage')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    await this.channelsService.remove(id, user);
  }
}
