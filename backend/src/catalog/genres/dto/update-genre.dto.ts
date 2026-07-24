import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateGenreDto } from './create-genre.dto';

export class UpdateGenreDto extends PartialType(OmitType(CreateGenreDto, ['tenantId'] as const)) {}
