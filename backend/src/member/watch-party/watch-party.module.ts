import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { WatchPartyController } from './watch-party.controller';
import { WatchPartyService } from './watch-party.service';
import { WatchPartyGateway } from './watch-party.gateway';

@Module({
  imports: [AuthModule],
  controllers: [WatchPartyController],
  providers: [WatchPartyService, WatchPartyGateway],
})
export class WatchPartyModule {}
