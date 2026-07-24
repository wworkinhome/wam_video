import { IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class CreateTenantDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name: string;

  @IsString()
  @Matches(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
    message: 'slug must be lowercase alphanumeric with hyphens (e.g. "acme-tv")',
  })
  slug: string;

  @IsOptional()
  @IsString()
  domain?: string;
}
