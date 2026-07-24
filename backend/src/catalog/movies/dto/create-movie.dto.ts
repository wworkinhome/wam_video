import { IsArray, IsBoolean, IsInt, IsOptional, IsString, IsUUID, Matches, Min, MinLength } from 'class-validator';

export class CreateMovieDto {
  @IsUUID()
  tenantId: string;

  @IsString()
  @MinLength(1)
  title: string;

  @IsString()
  @Matches(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
    message: 'slug must be lowercase alphanumeric with hyphens (e.g. "the-matrix")',
  })
  slug: string;

  @IsOptional()
  @IsString()
  synopsis?: string;

  @IsOptional()
  @IsInt()
  @Min(1888)
  releaseYear?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  durationMinutes?: number;

  @IsOptional()
  @IsString()
  posterUrl?: string;

  @IsOptional()
  @IsString()
  backdropUrl?: string;

  @IsOptional()
  @IsString()
  trailerUrl?: string;

  @IsOptional()
  @IsString()
  videoUrl?: string;

  @IsOptional()
  @IsBoolean()
  isPremium?: boolean;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  genreIds?: string[];
}
