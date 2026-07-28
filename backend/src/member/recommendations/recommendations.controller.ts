import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../auth/strategies/jwt.strategy';
import { RecommendationsService } from './recommendations.service';
import { ListRecommendationsDto } from './dto/list-recommendations.dto';

@Controller('profiles/:profileId/recommendations')
@UseGuards(JwtAuthGuard)
export class RecommendationsController {
  constructor(private readonly recommendations: RecommendationsService) {}

  @Get()
  get(@Param('profileId') profileId: string, @Query() query: ListRecommendationsDto, @CurrentUser() user: AuthenticatedUser) {
    return this.recommendations.getRecommendations(user, profileId, query.type);
  }
}
