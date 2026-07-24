import { IsOptional, IsString } from 'class-validator';

export class ResolveTenantDto {
  @IsOptional()
  @IsString()
  domain?: string;

  @IsOptional()
  @IsString()
  slug?: string;
}
