import { IsIn } from 'class-validator';

export class ListRecommendationsDto {
  @IsIn(['movie', 'series'])
  type: 'movie' | 'series';
}
