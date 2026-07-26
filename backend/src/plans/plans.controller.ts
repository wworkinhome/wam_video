import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { PlansService } from './plans.service';
import { ListPlansDto } from './dto/list-plans.dto';
import { CreatePlanDto } from './dto/create-plan.dto';

@Controller('plans')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Get()
  @Permissions('plans.manage')
  findAll(@Query() query: ListPlansDto) {
    return this.plansService.findAll(query);
  }

  @Post()
  @Permissions('plans.manage')
  create(@Body() dto: CreatePlanDto, @CurrentUser() user: AuthenticatedUser) {
    return this.plansService.create(dto, user);
  }
}
