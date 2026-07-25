import { IsBoolean, IsInt, IsOptional, IsString, IsUUID, Matches, Min, MinLength } from 'class-validator';

export class CreateChannelDto {
  @IsUUID()
  tenantId: string;

  @IsString()
  @MinLength(1)
  name: string;

  @IsString()
  @Matches(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
    message: 'slug must be lowercase alphanumeric with hyphens (e.g. "canal-1")',
  })
  slug: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsString()
  streamUrl?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsBoolean()
  isPremium?: boolean;

  @IsOptional()
  @IsBoolean()
  dvrEnabled?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  catchupWindowHours?: number;

  @IsOptional()
  @IsBoolean()
  timeshiftEnabled?: boolean;
}
