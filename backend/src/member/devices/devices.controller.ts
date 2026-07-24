import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../auth/strategies/jwt.strategy';
import { DevicesService } from './devices.service';
import { CreateDeviceDto } from './dto/create-device.dto';

// Rebanada mínima de lo que ARCHITECTURE.md describe como "DevicesModule" de Fase 2
// (self-registro únicamente, sin `Plan.maxDevices` ni revocación remota) — existe
// solo porque DownloadRequest.deviceId la necesita ya en Fase 1.
@Controller('devices')
@UseGuards(JwtAuthGuard)
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.devicesService.findAll(user.id);
  }

  @Post()
  create(@Body() dto: CreateDeviceDto, @CurrentUser() user: AuthenticatedUser) {
    return this.devicesService.create(user.id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    await this.devicesService.remove(user.id, id);
  }
}
