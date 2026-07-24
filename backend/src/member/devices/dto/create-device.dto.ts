import { DeviceType } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateDeviceDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsEnum(DeviceType)
  type: DeviceType;

  @IsOptional()
  @IsString()
  pushToken?: string;
}
