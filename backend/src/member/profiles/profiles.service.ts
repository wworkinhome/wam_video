import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { Profile } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { handlePrismaWrite } from '../../common/prisma-errors.util';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { VerifyPinDto } from './dto/verify-pin.dto';

const CONFLICT_MESSAGE = 'Could not save profile';

@Injectable()
export class ProfilesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateProfileDto) {
    const pinCodeHash = dto.pinCode ? await bcrypt.hash(dto.pinCode, 10) : undefined;
    const profile = await handlePrismaWrite(
      () =>
        this.prisma.profile.create({
          data: {
            userId,
            name: dto.name,
            avatarUrl: dto.avatarUrl,
            isKids: dto.isKids ?? false,
            pinCode: pinCodeHash,
          },
        }),
      CONFLICT_MESSAGE,
    );
    return this.toResponse(profile);
  }

  async findAll(userId: string) {
    const profiles = await this.prisma.profile.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } });
    return profiles.map((profile) => this.toResponse(profile));
  }

  async findOne(userId: string, id: string) {
    const profile = await this.getOwnedOrThrow(userId, id);
    return this.toResponse(profile);
  }

  async update(userId: string, id: string, dto: UpdateProfileDto) {
    await this.getOwnedOrThrow(userId, id);
    const pinCodeHash = dto.pinCode ? await bcrypt.hash(dto.pinCode, 10) : undefined;
    const profile = await handlePrismaWrite(
      () =>
        this.prisma.profile.update({
          where: { id },
          data: { name: dto.name, avatarUrl: dto.avatarUrl, isKids: dto.isKids, pinCode: pinCodeHash },
        }),
      CONFLICT_MESSAGE,
    );
    return this.toResponse(profile);
  }

  async remove(userId: string, id: string) {
    await this.getOwnedOrThrow(userId, id);
    await this.prisma.profile.delete({ where: { id } });
  }

  // El hash nunca sale del backend — el frontend solo recibe true/false.
  async verifyPin(userId: string, id: string, dto: VerifyPinDto) {
    const profile = await this.getOwnedOrThrow(userId, id);
    if (!profile.pinCode) {
      return { valid: true };
    }
    const valid = await bcrypt.compare(dto.pin, profile.pinCode);
    if (!valid) {
      throw new ForbiddenException('Incorrect PIN');
    }
    return { valid: true };
  }

  // Usado por Favorites/WatchHistory/Downloads/Playback para confirmar que el
  // profileId recibido en la request pertenece al usuario autenticado.
  async assertOwnership(userId: string, profileId: string): Promise<void> {
    await this.getOwnedOrThrow(userId, profileId);
  }

  private async getOwnedOrThrow(userId: string, id: string) {
    const profile = await this.prisma.profile.findFirst({ where: { id, userId } });
    if (!profile) {
      throw new NotFoundException(`Profile ${id} not found`);
    }
    return profile;
  }

  // El hash del PIN nunca debe salir de este service — se expone solo como flag.
  private toResponse(profile: Profile) {
    const { pinCode, ...rest } = profile;
    return { ...rest, hasPin: pinCode !== null };
  }
}
