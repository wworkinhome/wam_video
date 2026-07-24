import { IsBoolean, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class CreateProfileDto {
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  name: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsBoolean()
  isKids?: boolean;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4,6}$/, { message: 'pinCode must be 4 to 6 digits' })
  pinCode?: string;
}
