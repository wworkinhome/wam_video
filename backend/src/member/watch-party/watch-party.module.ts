import { Module } from '@nestjs/common';
import { WatchPartyController } from './watch-party.controller';
import { WatchPartyService } from './watch-party.service';

@Module({
  controllers: [WatchPartyController],
  providers: [WatchPartyService],
})
export class WatchPartyModule {}
