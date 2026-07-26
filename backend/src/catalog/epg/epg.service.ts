import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ListEpgDto } from './dto/list-epg.dto';

@Injectable()
export class EpgService {
  constructor(private readonly prisma: PrismaService) {}

  // Devuelve, por canal, los programas que se solapan con el día pedido (UTC).
  // Sin channelId trae todos los canales del tenant; con channelId acota a uno solo.
  async findGuide(query: ListEpgDto) {
    const day = query.date ? new Date(query.date) : new Date();
    const dayStart = new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate()));
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

    const channels = await this.prisma.channel.findMany({
      where: { tenantId: query.tenantId, id: query.channelId },
      orderBy: { name: 'asc' },
    });

    const programs = await this.prisma.epgProgram.findMany({
      where: {
        channelId: { in: channels.map((c) => c.id) },
        startTime: { lt: dayEnd },
        endTime: { gt: dayStart },
      },
      orderBy: { startTime: 'asc' },
    });

    return channels.map((channel) => ({
      channel,
      programs: programs.filter((p) => p.channelId === channel.id),
    }));
  }
}
