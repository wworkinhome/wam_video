import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { handlePrismaWrite } from '../common/prisma-errors.util';

const NOT_FOUND_MESSAGE = 'Notification not found';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    userId: string,
    options: { limit: number; offset: number; read?: boolean },
  ) {
    const where: Record<string, unknown> = { userId };
    if (options.read !== undefined) {
      where.readAt = options.read ? { not: null } : null;
    }

    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: options.limit,
        skip: options.offset,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return { data, total, page: Math.floor(options.offset / options.limit) + 1, limit: options.limit };
  }

  async unreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, readAt: null },
    });
    return { unread: count };
  }

  async create(userId: string, dto: CreateNotificationDto) {
    const notification = await handlePrismaWrite(
      () =>
        this.prisma.notification.create({
          data: {
            userId,
            title: dto.title,
            body: dto.body,
            channel: dto.channel,
            type: dto.type ?? 'GENERAL',
          },
        }),
      'Could not create notification',
    );
    return notification;
  }

  async markAllRead(userId: string, dto: { ids?: string[] }) {
    if (dto.ids && dto.ids.length > 0) {
      await this.prisma.notification.updateMany({
        where: { id: { in: dto.ids }, userId, readAt: null },
        data: { readAt: new Date() },
      });
      return { updated: dto.ids.length };
    }

    const result = await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { updated: result.count };
  }

  async markRead(userId: string, id: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });
    if (!notification || notification.userId !== userId) {
      throw new NotFoundException(NOT_FOUND_MESSAGE);
    }
    if (notification.readAt) {
      return notification;
    }
    await this.prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });
    return notification;
  }

  async remove(userId: string, id: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });
    if (!notification || notification.userId !== userId) {
      throw new NotFoundException(NOT_FOUND_MESSAGE);
    }
    await this.prisma.notification.delete({ where: { id } });
  }
}