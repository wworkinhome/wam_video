import { Module } from '@nestjs/common';
import { GenresModule } from './genres/genres.module';
import { MoviesModule } from './movies/movies.module';
import { SeriesModule } from './series/series.module';
import { ChannelsModule } from './channels/channels.module';
import { EpgModule } from './epg/epg.module';

@Module({
  imports: [GenresModule, MoviesModule, SeriesModule, ChannelsModule, EpgModule],
})
export class CatalogModule {}
