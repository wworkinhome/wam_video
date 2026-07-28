import { Injectable } from '@nestjs/common';
import { ContentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthenticatedUser } from '../../auth/strategies/jwt.strategy';
import { ProfilesService } from '../profiles/profiles.service';

const MOVIE_INCLUDE = { genres: { include: { genre: true } } } satisfies Prisma.MovieInclude;
const SERIES_INCLUDE = {
  genres: { include: { genre: true } },
  seasons: { take: 1, orderBy: { number: 'asc' }, include: { episodes: { take: 1, orderBy: { number: 'asc' } } } },
} satisfies Prisma.SeriesInclude;

const HISTORY_SAMPLE_SIZE = 50;
const RECOMMENDATIONS_LIMIT = 20;

// Recomendaciones simples por afinidad de género: mira el WatchHistory reciente del
// perfil (películas y series, pesando lo ya terminado el doble que lo empezado), elige
// el género más visto, y recomienda contenido de ese género que el perfil no haya visto
// todavía. Sin historial (perfil nuevo), cae a "más reciente" sin género específico.
@Injectable()
export class RecommendationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly profilesService: ProfilesService,
  ) {}

  async getRecommendations(user: AuthenticatedUser, profileId: string, type: 'movie' | 'series') {
    await this.profilesService.assertOwnership(user.id, profileId);
    const profile = await this.prisma.profile.findUnique({ where: { id: profileId }, select: { isKids: true } });

    const history = await this.prisma.watchHistory.findMany({
      where: { profileId },
      orderBy: { updatedAt: 'desc' },
      take: HISTORY_SAMPLE_SIZE,
      select: {
        movieId: true,
        completed: true,
        movie: { select: { genres: { select: { genreId: true } } } },
        episode: {
          select: {
            season: { select: { series: { select: { id: true, genres: { select: { genreId: true } } } } } },
          },
        },
      },
    });

    const genreScores = new Map<string, number>();
    const watchedMovieIds = new Set<string>();
    const watchedSeriesIds = new Set<string>();
    const bump = (genreId: string, weight: number) => genreScores.set(genreId, (genreScores.get(genreId) ?? 0) + weight);

    for (const entry of history) {
      const weight = entry.completed ? 2 : 1;
      if (entry.movieId && entry.movie) {
        watchedMovieIds.add(entry.movieId);
        entry.movie.genres.forEach((g) => bump(g.genreId, weight));
      }
      const series = entry.episode?.season?.series;
      if (series) {
        watchedSeriesIds.add(series.id);
        series.genres.forEach((g) => bump(g.genreId, weight));
      }
    }

    const topGenreId = [...genreScores.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

    if (type === 'movie') {
      return this.recommendMovies(user.tenantId, profile?.isKids ?? false, watchedMovieIds, topGenreId);
    }
    return this.recommendSeries(user.tenantId, profile?.isKids ?? false, watchedSeriesIds, topGenreId);
  }

  private async recommendMovies(
    tenantId: string | null,
    isKids: boolean,
    excludeIds: Set<string>,
    topGenreId: string | null,
  ) {
    const baseWhere: Prisma.MovieWhereInput = {
      tenantId: tenantId ?? undefined,
      status: ContentStatus.PUBLISHED,
      id: { notIn: [...excludeIds] },
      isKids: isKids || undefined,
    };

    let items = await this.prisma.movie.findMany({
      where: { ...baseWhere, genres: topGenreId ? { some: { genreId: topGenreId } } : undefined },
      take: RECOMMENDATIONS_LIMIT,
      orderBy: { createdAt: 'desc' },
      include: MOVIE_INCLUDE,
      relationLoadStrategy: 'join',
    });

    let basedOnGenre: string | null = null;
    if (items.length > 0 && topGenreId) {
      basedOnGenre = await this.genreName(topGenreId);
    } else if (items.length === 0) {
      // Catálogo chico o sin señal — recién no hay nada en el género top, mostramos lo más reciente.
      items = await this.prisma.movie.findMany({
        where: baseWhere,
        take: RECOMMENDATIONS_LIMIT,
        orderBy: { createdAt: 'desc' },
        include: MOVIE_INCLUDE,
        relationLoadStrategy: 'join',
      });
    }

    return { basedOnGenre, items };
  }

  private async recommendSeries(
    tenantId: string | null,
    isKids: boolean,
    excludeIds: Set<string>,
    topGenreId: string | null,
  ) {
    const baseWhere: Prisma.SeriesWhereInput = {
      tenantId: tenantId ?? undefined,
      status: ContentStatus.PUBLISHED,
      id: { notIn: [...excludeIds] },
      isKids: isKids || undefined,
    };

    let items = await this.prisma.series.findMany({
      where: { ...baseWhere, genres: topGenreId ? { some: { genreId: topGenreId } } : undefined },
      take: RECOMMENDATIONS_LIMIT,
      orderBy: { createdAt: 'desc' },
      include: SERIES_INCLUDE,
      relationLoadStrategy: 'join',
    });

    let basedOnGenre: string | null = null;
    if (items.length > 0 && topGenreId) {
      basedOnGenre = await this.genreName(topGenreId);
    } else if (items.length === 0) {
      items = await this.prisma.series.findMany({
        where: baseWhere,
        take: RECOMMENDATIONS_LIMIT,
        orderBy: { createdAt: 'desc' },
        include: SERIES_INCLUDE,
        relationLoadStrategy: 'join',
      });
    }

    return { basedOnGenre, items };
  }

  private async genreName(genreId: string): Promise<string | null> {
    const genre = await this.prisma.genre.findUnique({ where: { id: genreId }, select: { name: true } });
    return genre?.name ?? null;
  }
}
