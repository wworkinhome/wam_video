import { Controller, Get, Query } from '@nestjs/common';
import { EpgService } from './epg.service';
import { ListEpgDto } from './dto/list-epg.dto';

@Controller('epg')
export class EpgController {
  constructor(private readonly epgService: EpgService) {}

  @Get()
  findGuide(@Query() query: ListEpgDto) {
    return this.epgService.findGuide(query);
  }
}
