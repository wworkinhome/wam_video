import { Module } from '@nestjs/common';
import { ProfilesModule } from '../profiles/profiles.module';
import { DownloadsController } from './downloads.controller';
import { DownloadsService } from './downloads.service';

@Module({
  imports: [ProfilesModule],
  controllers: [DownloadsController],
  providers: [DownloadsService],
})
export class DownloadsModule {}
