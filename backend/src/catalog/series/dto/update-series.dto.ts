import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateSeriesDto } from './create-series.dto';

export class UpdateSeriesDto extends PartialType(OmitType(CreateSeriesDto, ['tenantId'] as const)) {}
