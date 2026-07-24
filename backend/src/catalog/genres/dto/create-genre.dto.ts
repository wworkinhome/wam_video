import { IsString, IsUUID, Matches, MaxLength, MinLength } from 'class-validator';

export class CreateGenreDto {
  @IsUUID()
  tenantId: string;

  @IsString()
  @MinLength(2)
  @MaxLength(60)
  name: string;

  @IsString()
  @Matches(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
    message: 'slug must be lowercase alphanumeric with hyphens (e.g. "sci-fi")',
  })
  slug: string;
}
