import { Type } from 'class-transformer';
import { IsIn, IsInt, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { BillingInterval } from '@prisma/client';

export class CreatePlanDto {
  @IsUUID()
  tenantId: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsIn(['MONTHLY', 'YEARLY'])
  billingInterval: BillingInterval;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxProfiles?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxDevices?: number;

  @IsOptional()
  @IsString()
  videoQuality?: string;
}
