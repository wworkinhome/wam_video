import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../auth/strategies/jwt.strategy';
import { ProfilesService } from './profiles.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { VerifyPinDto } from './dto/verify-pin.dto';

@Controller('profiles')
@UseGuards(JwtAuthGuard)
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.profilesService.findAll(user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.profilesService.findOne(user.id, id);
  }

  @Post()
  create(@Body() dto: CreateProfileDto, @CurrentUser() user: AuthenticatedUser) {
    return this.profilesService.create(user.id, dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProfileDto, @CurrentUser() user: AuthenticatedUser) {
    return this.profilesService.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    await this.profilesService.remove(user.id, id);
  }

  @Post(':id/verify-pin')
  @HttpCode(HttpStatus.OK)
  verifyPin(@Param('id') id: string, @Body() dto: VerifyPinDto, @CurrentUser() user: AuthenticatedUser) {
    return this.profilesService.verifyPin(user.id, id, dto);
  }
}
