import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TenantAccessService } from '../auth/tenant-access.service';
import { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { ListPlansDto } from './dto/list-plans.dto';
import { CreatePlanDto } from './dto/create-plan.dto';

@Injectable()
export class PlansService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantAccess: TenantAccessService,
  ) {}

  findAll(query: ListPlansDto) {
    const where: Prisma.PlanWhereInput = { tenantId: query.tenantId, isActive: true };
    return this.prisma.plan.findMany({ where, orderBy: { price: 'asc' } });
  }

  create(dto: CreatePlanDto, user: AuthenticatedUser) {
    this.tenantAccess.assertHasTenantPermission(user, dto.tenantId, 'plans.manage');
    return this.prisma.plan.create({ data: dto });
  }
}
