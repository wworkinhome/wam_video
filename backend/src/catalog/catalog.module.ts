import { Module } from '@nestjs/common';
import { GenresModule } from './genres/genres.module';
import { MoviesModule } from './movies/movies.module';
import { SeriesModule } from './series/series.module';

@Module({
  imports: [GenresModule, MoviesModule, SeriesModule],
})
export class CatalogModule {}
