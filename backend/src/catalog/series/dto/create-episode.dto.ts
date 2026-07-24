import { IsDateString, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateEpisodeDto {
  @IsInt()
  @Min(0)
  number: number;

  @IsString()
  @MinLength(1)
  title: string;

  @IsOptional()
  @IsString()
  synopsis?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  durationMinutes?: number;

  @IsOptional()
  @IsString()
  videoUrl?: string;

  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @IsOptional()
  @IsDateString()
  airDate?: string;
}
