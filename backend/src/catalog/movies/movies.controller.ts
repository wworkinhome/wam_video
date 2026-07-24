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
import { MoviesService } from './movies.service';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { ListMoviesDto } from './dto/list-movies.dto';

@Controller('movies')
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) {}

  @Get()
  findAll(@Query() query: ListMoviesDto) {
    return this.moviesService.findAllPublished(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.moviesService.findOnePublished(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('content.manage')
  create(@Body() dto: CreateMovieDto, @CurrentUser() user: AuthenticatedUser) {
    return this.moviesService.create(dto, user);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('content.manage')
  update(@Param('id') id: string, @Body() dto: UpdateMovieDto, @CurrentUser() user: AuthenticatedUser) {
    return this.moviesService.update(id, dto, user);
  }

  @Post(':id/publish')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('content.publish')
  @HttpCode(HttpStatus.OK)
  publish(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.moviesService.publish(id, user);
  }

  @Post(':id/archive')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('content.publish')
  @HttpCode(HttpStatus.OK)
  archive(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.moviesService.archive(id, user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('content.manage')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    await this.moviesService.remove(id, user);
  }
}
