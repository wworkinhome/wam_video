import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateSeasonDto {
  @IsInt()
  @Min(0)
  number: number;

  @IsOptional()
  @IsString()
  title?: string;
}
