import { IsOptional, IsUUID } from 'class-validator';

export class CreateDownloadDto {
  @IsUUID()
  deviceId: string;

  @IsOptional()
  @IsUUID()
  movieId?: string;

  @IsOptional()
  @IsUUID()
  episodeId?: string;
}
