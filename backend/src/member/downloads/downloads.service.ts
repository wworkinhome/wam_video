import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DownloadStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { handlePrismaWrite } from '../../common/prisma-errors.util';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { ProfilesService } from '../profiles/profiles.service';
import { CreateDownloadDto } from './dto/create-download.dto';

const CONFLICT_MESSAGE = 'Invalid device, movie or episode reference';

@Injectable()
export class DownloadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly profilesService: ProfilesService,
  ) {}

  async findAll(userId: string, profileId: string, query: PaginationQueryDto) {
    await this.profilesService.assertOwnership(userId, profileId);
    const where = { profileId };
    const [data, total] = await Promise.all([
      this.prisma.downloadRequest.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        include: { movie: true, episode: true, device: true },
      }),
      this.prisma.downloadRequest.count({ where }),
    ]);
    return { data, total, page: query.page, limit: query.limit };
  }

  async create(userId: string, profileId: string, dto: CreateDownloadDto) {
    await this.profilesService.assertOwnership(userId, profileId);
    await this.assertDeviceOwnership(userId, dto.deviceId);
    this.assertExactlyOne(dto);

    return handlePrismaWrite(
      () =>
        this.prisma.downloadRequest.create({
          data: {
            profileId,
            deviceId: dto.deviceId,
            movieId: dto.movieId,
            episodeId: dto.episodeId,
            status: DownloadStatus.REQUESTED,
          },
        }),
      CONFLICT_MESSAGE,
    );
  }

  async revoke(userId: string, id: string) {
    const download = await this.getOwnedOrThrow(userId, id);
    return this.prisma.downloadRequest.update({
      where: { id: download.id },
      data: { status: DownloadStatus.REVOKED },
    });
  }

  async remove(userId: string, id: string) {
    const download = await this.getOwnedOrThrow(userId, id);
    await this.prisma.downloadRequest.delete({ where: { id: download.id } });
  }

  private async getOwnedOrThrow(userId: string, id: string) {
    const download = await this.prisma.downloadRequest.findFirst({ where: { id, profile: { userId } } });
    if (!download) {
      throw new NotFoundException(`Download ${id} not found`);
    }
    return download;
  }

  private async assertDeviceOwnership(userId: string, deviceId: string) {
    const device = await this.prisma.device.findFirst({ where: { id: deviceId, userId } });
    if (!device) {
      throw new BadRequestException('Device does not belong to the current user');
    }
  }

  private assertExactlyOne(dto: CreateDownloadDto) {
    const count = [dto.movieId, dto.episodeId].filter(Boolean).length;
    if (count !== 1) {
      throw new BadRequestException('Provide exactly one of movieId or episodeId');
    }
  }
}
