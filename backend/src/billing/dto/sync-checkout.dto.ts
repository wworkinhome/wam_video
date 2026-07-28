import { IsString, IsUUID } from 'class-validator';

export class SyncCheckoutDto {
  @IsUUID()
  paymentId: string;

  @IsString()
  transactionId: string;
}
