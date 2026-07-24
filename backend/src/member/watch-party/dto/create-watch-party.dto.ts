import { IsOptional, IsUUID } from 'class-validator';

export class CreateWatchPartyDto {
  @IsOptional()
  @IsUUID()
  movieId?: string;

  @IsOptional()
  @IsUUID()
  episodeId?: string;

  @IsOptional()
  @IsUUID()
  eventId?: string;
}
