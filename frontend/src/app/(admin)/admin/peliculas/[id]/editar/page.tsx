import { getCurrentUser } from '@/lib/auth/get-current-user';
import { serverFetch } from '@/lib/api/server';
import type { Paginated, Genre, Movie } from '@/lib/api/types';
import { MovieForm } from '../../movie-form';

export default async function EditMoviePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  const [movie, genres] = await Promise.all([
    serverFetch<Movie>(`/movies/admin/${id}`, { withTenant: false }),
    serverFetch<Paginated<Genre>>(`/genres?${user?.tenant ? `tenantId=${user.tenant.id}&` : ''}limit=100`, {
      withTenant: false,
    }),
  ]);

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-6 text-2xl font-bold">Editar película</h1>
      <MovieForm mode="edit" movie={movie} genres={genres.data} />
    </div>
  );
}
