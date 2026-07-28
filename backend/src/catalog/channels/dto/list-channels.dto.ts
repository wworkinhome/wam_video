import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class ListChannelsDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  // Variante de `slug` para traer varios canales puntuales en un solo round-trip
  // (ej. los canales destacados del home) en vez de una consulta por canal.
  // Coma-separado: ?slugs=caracol-tv,canal-rcn,win-sports
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.split(',').filter(Boolean) : value))
  @IsString({ each: true })
  slugs?: string[];

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  q?: string;

  // 'unchecked' = streamStatus es null (nunca se corrió el chequeo para ese canal).
  @IsOptional()
  @IsIn(['ok', 'broken', 'unchecked'])
  status?: 'ok' | 'broken' | 'unchecked';
}
