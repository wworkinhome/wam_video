import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class ListEpgDto {
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @IsOptional()
  @IsUUID()
  channelId?: string;

  // Fecha del día a consultar (YYYY-MM-DD). Default: hoy (UTC).
  @IsOptional()
  @IsDateString()
  date?: string;
}
