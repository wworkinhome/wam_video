import { IsOptional, IsUUID } from 'class-validator';

export class ListPlansDto {
  @IsOptional()
  @IsUUID()
  tenantId?: string;
}
