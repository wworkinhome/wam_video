import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateChannelDto } from './create-channel.dto';

export class UpdateChannelDto extends PartialType(OmitType(CreateChannelDto, ['tenantId'] as const)) {}
