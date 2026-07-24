import { IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class ListGenresDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  tenantId?: string;
}
