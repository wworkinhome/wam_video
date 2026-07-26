import { IsOptional, IsUUID } from 'class-validator';

// planId ausente/null = quitar el plan activo (usuario vuelve a nivel gratuito).
export class AssignPlanDto {
  @IsOptional()
  @IsUUID()
  planId?: string | null;
}
