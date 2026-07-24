import { Module } from '@nestjs/common';
import { ProfilesModule } from '../profiles/profiles.module';
import { WatchHistoryController } from './watch-history.controller';
import { WatchHistoryService } from './watch-history.service';

@Module({
  imports: [ProfilesModule],
  controllers: [WatchHistoryController],
  providers: [WatchHistoryService],
  exports: [WatchHistoryService],
})
export class WatchHistoryModule {}
