import { Module } from '@nestjs/common';
import { ProfilesModule } from '../profiles/profiles.module';
import { WatchHistoryModule } from '../watch-history/watch-history.module';
import { PlaybackController } from './playback.controller';
import { PlaybackService } from './playback.service';

@Module({
  imports: [ProfilesModule, WatchHistoryModule],
  controllers: [PlaybackController],
  providers: [PlaybackService],
})
export class PlaybackModule {}
