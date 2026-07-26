import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { UsersService } from './users.service';
import { ListUsersDto } from './dto/list-users.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { AssignPlanDto } from './dto/assign-plan.dto';

@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Permissions('users.view')
  findAll(@Query() query: ListUsersDto, @CurrentUser() user: AuthenticatedUser) {
    return this.usersService.findAllForAdmin(query, user);
  }

  @Patch(':id/status')
  @Permissions('users.manage')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateUserStatusDto, @CurrentUser() user: AuthenticatedUser) {
    return this.usersService.updateStatus(id, dto, user);
  }

  @Patch(':id/plan')
  @Permissions('users.manage')
  assignPlan(@Param('id') id: string, @Body() dto: AssignPlanDto, @CurrentUser() user: AuthenticatedUser) {
    return this.usersService.assignPlan(id, dto, user);
  }
}
