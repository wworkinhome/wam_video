import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDeviceDto } from './dto/create-device.dto';

@Injectable()
export class DevicesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(userId: string) {
    return this.prisma.device.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  }

  create(userId: string, dto: CreateDeviceDto) {
    return this.prisma.device.create({
      data: { userId, name: dto.name, type: dto.type, pushToken: dto.pushToken },
    });
  }

  async remove(userId: string, id: string) {
    const device = await this.prisma.device.findFirst({ where: { id, userId } });
    if (!device) {
      throw new NotFoundException(`Device ${id} not found`);
    }
    await this.prisma.device.delete({ where: { id } });
  }
}
