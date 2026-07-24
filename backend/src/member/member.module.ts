import { Module } from '@nestjs/common';
import { ProfilesModule } from './profiles/profiles.module';
import { DevicesModule } from './devices/devices.module';
import { FavoritesModule } from './favorites/favorites.module';
import { WatchHistoryModule } from './watch-history/watch-history.module';
import { PlaybackModule } from './playback/playback.module';
import { DownloadsModule } from './downloads/downloads.module';
import { WatchPartyModule } from './watch-party/watch-party.module';

@Module({
  imports: [
    ProfilesModule,
    DevicesModule,
    FavoritesModule,
    WatchHistoryModule,
    PlaybackModule,
    DownloadsModule,
    WatchPartyModule,
  ],
})
export class MemberModule {}
