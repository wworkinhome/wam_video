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
import { SeriesService } from './series.service';
import { CreateSeriesDto } from './dto/create-series.dto';
import { UpdateSeriesDto } from './dto/update-series.dto';
import { ListSeriesDto } from './dto/list-series.dto';

@Controller('series')
export class SeriesController {
  constructor(private readonly seriesService: SeriesService) {}

  @Get()
  findAll(@Query() query: ListSeriesDto) {
    return this.seriesService.findAllPublished(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.seriesService.findOnePublished(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('content.manage')
  create(@Body() dto: CreateSeriesDto, @CurrentUser() user: AuthenticatedUser) {
    return this.seriesService.create(dto, user);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('content.manage')
  update(@Param('id') id: string, @Body() dto: UpdateSeriesDto, @CurrentUser() user: AuthenticatedUser) {
    return this.seriesService.update(id, dto, user);
  }

  @Post(':id/publish')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('content.publish')
  @HttpCode(HttpStatus.OK)
  publish(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.seriesService.publish(id, user);
  }

  @Post(':id/archive')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('content.publish')
  @HttpCode(HttpStatus.OK)
  archive(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.seriesService.archive(id, user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('content.manage')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    await this.seriesService.remove(id, user);
  }
}
