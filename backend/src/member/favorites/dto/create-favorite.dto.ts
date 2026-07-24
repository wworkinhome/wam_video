import { IsOptional, IsUUID } from 'class-validator';

export class CreateFavoriteDto {
  @IsOptional()
  @IsUUID()
  movieId?: string;

  @IsOptional()
  @IsUUID()
  seriesId?: string;
}
