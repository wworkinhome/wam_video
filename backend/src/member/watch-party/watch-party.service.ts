import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, WatchPartyStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateWatchPartyDto } from './dto/create-watch-party.dto';

// Caracteres sin ambigüedad visual (sin 0/O/1/I) para códigos de join legibles en pantalla.
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 6;
const MAX_CODE_ATTEMPTS = 5;

@Injectable()
export class WatchPartyService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateWatchPartyDto) {
    this.assertExactlyOne(dto);

    for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
      try {
        return await this.prisma.watchParty.create({
          data: {
            hostUserId: userId,
            movieId: dto.movieId,
            episodeId: dto.episodeId,
            eventId: dto.eventId,
            code: this.generateCode(),
          },
        });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
          continue;
        }
        throw error;
      }
    }
    throw new ConflictException('Could not generate a unique watch party code, try again');
  }

  findOne(id: string) {
    return this.findOrThrow(id);
  }

  async isMember(partyId: string, userId: string): Promise<boolean> {
    const party = await this.prisma.watchParty.findUnique({
      where: { id: partyId },
      include: { participants: { where: { userId } } },
    });
    if (!party) return false;
    return party.hostUserId === userId || party.participants.length > 0;
  }

  async listMessages(userId: string, id: string) {
    const party = await this.findOrThrow(id);
    const isMember = party.hostUserId === userId || party.participants.some((p) => p.userId === userId);
    if (!isMember) {
      throw new ForbiddenException('You are not a participant of this watch party');
    }
    return this.prisma.watchPartyMessage.findMany({
      where: { watchPartyId: id },
      orderBy: { createdAt: 'asc' },
      take: 200,
      include: { user: { select: { id: true, name: true } } },
    });
  }

  findByCode(code: string) {
    return this.findOrThrowByCode(code);
  }

  async join(userId: string, id: string) {
    await this.findOrThrow(id);
    await this.prisma.watchPartyParticipant.upsert({
      where: { watchPartyId_userId: { watchPartyId: id, userId } },
      update: {},
      create: { watchPartyId: id, userId },
    });
    return this.findOrThrow(id);
  }

  async start(userId: string, id: string) {
    const party = await this.findOrThrow(id);
    this.assertIsHost(party.hostUserId, userId);
    if (party.status !== WatchPartyStatus.SCHEDULED) {
      throw new BadRequestException('Watch party already started or ended');
    }
    return this.prisma.watchParty.update({
      where: { id },
      data: { status: WatchPartyStatus.LIVE, startedAt: new Date() },
    });
  }

  async end(userId: string, id: string) {
    const party = await this.findOrThrow(id);
    this.assertIsHost(party.hostUserId, userId);
    if (party.status !== WatchPartyStatus.LIVE) {
      throw new BadRequestException('Watch party is not live');
    }
    return this.prisma.watchParty.update({
      where: { id },
      data: { status: WatchPartyStatus.ENDED, endedAt: new Date() },
    });
  }

  async remove(userId: string, id: string) {
    const party = await this.findOrThrow(id);
    this.assertIsHost(party.hostUserId, userId);
    if (party.status !== WatchPartyStatus.SCHEDULED) {
      throw new BadRequestException('Cannot delete a watch party that already started');
    }
    await this.prisma.watchParty.delete({ where: { id } });
  }

  private assertIsHost(hostUserId: string, userId: string) {
    if (hostUserId !== userId) {
      throw new ForbiddenException('Only the host can perform this action');
    }
  }

  private assertExactlyOne(dto: CreateWatchPartyDto) {
    const count = [dto.movieId, dto.episodeId, dto.eventId].filter(Boolean).length;
    if (count !== 1) {
      throw new BadRequestException('Provide exactly one of movieId, episodeId or eventId');
    }
  }

  private generateCode(): string {
    return Array.from({ length: CODE_LENGTH }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join(
      '',
    );
  }

  private async findOrThrow(id: string) {
    const party = await this.prisma.watchParty.findUnique({ where: { id }, include: { participants: true } });
    if (!party) {
      throw new NotFoundException(`Watch party ${id} not found`);
    }
    return party;
  }

  private async findOrThrowByCode(code: string) {
    const party = await this.prisma.watchParty.findUnique({ where: { code }, include: { participants: true } });
    if (!party) {
      throw new NotFoundException(`Watch party with code ${code} not found`);
    }
    return party;
  }
}
