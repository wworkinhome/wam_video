import { IsString, Matches } from 'class-validator';

export class VerifyPinDto {
  @IsString()
  @Matches(/^\d{4,6}$/, { message: 'pin must be 4 to 6 digits' })
  pin: string;
}
