import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { SeriesController } from './series.controller';
import { SeriesService } from './series.service';
import { SeasonsController } from './seasons.controller';
import { SeasonsService } from './seasons.service';
import { EpisodesController } from './episodes.controller';
import { EpisodesService } from './episodes.service';

@Module({
  imports: [AuthModule],
  controllers: [SeriesController, SeasonsController, EpisodesController],
  providers: [SeriesService, SeasonsService, EpisodesService],
})
export class SeriesModule {}
