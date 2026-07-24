import { IsBoolean, IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class PlaybackHeartbeatDto {
  @IsUUID()
  profileId: string;

  @IsOptional()
  @IsUUID()
  movieId?: string;

  @IsOptional()
  @IsUUID()
  episodeId?: string;

  @IsInt()
  @Min(0)
  progressSeconds: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  durationSeconds?: number;

  @IsOptional()
  @IsBoolean()
  completed?: boolean;
}
