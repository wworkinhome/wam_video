import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { WompiService } from './wompi.service';

@Module({
  imports: [AuthModule],
  controllers: [BillingController],
  providers: [BillingService, WompiService],
})
export class BillingModule {}
