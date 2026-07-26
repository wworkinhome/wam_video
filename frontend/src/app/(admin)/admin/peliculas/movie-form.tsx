'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { clientFetch } from '@/lib/api/client';
import type { Movie, Genre, Tenant } from '@/lib/api/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { VideoTestField } from '@/components/admin/video-test-field';
import { CONTENT_CATEGORIES } from '@/lib/content-categories';
import { cn } from '@/lib/utils';

const DIACRITICS_REGEX = new RegExp('[̀-ͯ]', 'g');

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(DIACRITICS_REGEX, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

type MovieFormProps =
  | { mode: 'create'; tenants: Tenant[]; defaultTenantId: string | null; genres: Genre[]; movie?: undefined }
  | { mode: 'edit'; tenants?: undefined; defaultTenantId?: undefined; genres: Genre[]; movie: Movie };

export function MovieForm(props: MovieFormProps) {
  const isEdit = props.mode === 'edit';
  const router = useRouter();

  const [tenantId, setTenantId] = useState(
    isEdit ? props.movie.tenantId : (props.defaultTenantId ?? props.tenants[0]?.id ?? ''),
  );
  const [title, setTitle] = useState(isEdit ? props.movie.title : '');
  const [slug, setSlug] = useState(isEdit ? props.movie.slug : '');
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [synopsis, setSynopsis] = useState(isEdit ? (props.movie.synopsis ?? '') : '');
  const [releaseYear, setReleaseYear] = useState(isEdit ? (props.movie.releaseYear?.toString() ?? '') : '');
  const [durationMinutes, setDurationMinutes] = useState(
    isEdit ? (props.movie.durationMinutes?.toString() ?? '') : '',
  );
  const [posterUrl, setPosterUrl] = useState(isEdit ? (props.movie.posterUrl ?? '') : '');
  const [backdropUrl, setBackdropUrl] = useState(isEdit ? (props.movie.backdropUrl ?? '') : '');
  const [trailerUrl, setTrailerUrl] = useState(isEdit ? (props.movie.trailerUrl ?? '') : '');
  const [videoUrl, setVideoUrl] = useState(isEdit ? (props.movie.videoUrl ?? '') : '');
  const [category, setCategory] = useState(isEdit ? (props.movie.category ?? '') : '');
  const [isPremium, setIsPremium] = useState(isEdit ? props.movie.isPremium : false);
  const [isKids, setIsKids] = useState(isEdit ? props.movie.isKids : false);
  const [genreIds, setGenreIds] = useState<string[]>(
    isEdit ? (props.movie.genres ?? []).map((g) => g.genre.id) : [],
  );

  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  function toggleGenre(id: string) {
    setGenreIds((prev) => (prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]));
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const body = {
        title,
        slug,
        synopsis: synopsis || undefined,
        releaseYear: releaseYear ? Number(releaseYear) : undefined,
        durationMinutes: durationMinutes ? Number(durationMinutes) : undefined,
        posterUrl: posterUrl || undefined,
        backdropUrl: backdropUrl || undefined,
        trailerUrl: trailerUrl || undefined,
        videoUrl: videoUrl || undefined,
        category: category || undefined,
        isPremium,
        isKids,
        genreIds,
      };
      if (isEdit) {
        await clientFetch(`/movies/${props.movie.id}`, { method: 'PATCH', body: JSON.stringify(body) });
        toast.success('Película actualizada');
      } else {
        await clientFetch('/movies', { method: 'POST', body: JSON.stringify({ ...body, tenantId }) });
        toast.success('Película creada');
      }
      router.push('/admin/peliculas');
      router.refresh();
    } catch {
      toast.error(isEdit ? 'No se pudo actualizar la película' : 'No se pudo crear la película (revisá el slug)');
    } finally {
      setSaving(false);
    }
  }

  async function handlePublishToggle() {
    if (!isEdit) return;
    setPublishing(true);
    try {
      const action = props.movie.status === 'PUBLISHED' ? 'archive' : 'publish';
      await clientFetch(`/movies/${props.movie.id}/${action}`, { method: 'POST' });
      toast.success(action === 'publish' ? 'Película publicada' : 'Película archivada');
      router.refresh();
    } catch {
      toast.error('No se pudo cambiar el estado');
    } finally {
      setPublishing(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-5">
      {isEdit && (
        <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4">
          <div>
            <p className="text-sm font-semibold text-white">Estado</p>
            <span
              className={cn(
                'mt-1 inline-block rounded-full px-2.5 py-1 text-xs font-medium',
                props.movie.status === 'PUBLISHED' && 'bg-emerald-500/20 text-emerald-300',
                props.movie.status === 'DRAFT' && 'bg-white/10 text-white/60',
                props.movie.status === 'ARCHIVED' && 'bg-amber-500/20 text-amber-300',
              )}
            >
              {props.movie.status}
            </span>
          </div>
          <Button type="button" variant="outline" disabled={publishing} onClick={handlePublishToggle}>
            {props.movie.status === 'PUBLISHED' ? 'Archivar' : 'Publicar'}
          </Button>
        </div>
      )}

      {!isEdit && props.tenants.length > 1 && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tenant">Tenant</Label>
          <select
            id="tenant"
            value={tenantId}
            onChange={(event) => setTenantId(event.target.value)}
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
          >
            {props.tenants.map((tenant) => (
              <option key={tenant.id} value={tenant.id} className="bg-black">
                {tenant.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="title">Título</Label>
        <Input id="title" required value={title} onChange={(event) => handleTitleChange(event.target.value)} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="slug">Slug</Label>
        <Input
          id="slug"
          required
          value={slug}
          onChange={(event) => {
            setSlugTouched(true);
            setSlug(event.target.value);
          }}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="synopsis">Sinopsis</Label>
        <textarea
          id="synopsis"
          value={synopsis}
          onChange={(event) => setSynopsis(event.target.value)}
          rows={3}
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="releaseYear">Año</Label>
          <Input
            id="releaseYear"
            type="number"
            value={releaseYear}
            onChange={(event) => setReleaseYear(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="durationMinutes">Duración (min)</Label>
          <Input
            id="durationMinutes"
            type="number"
            value={durationMinutes}
            onChange={(event) => setDurationMinutes(event.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="category">Categoría</Label>
        <Input
          id="category"
          list="content-categories"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          placeholder="Deportes, Noticias, Música, Kids…"
        />
        <datalist id="content-categories">
          {CONTENT_CATEGORIES.map((cat) => (
            <option key={cat} value={cat} />
          ))}
        </datalist>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="posterUrl">Póster (URL)</Label>
        <Input id="posterUrl" value={posterUrl} onChange={(event) => setPosterUrl(event.target.value)} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="backdropUrl">Backdrop (URL)</Label>
        <Input id="backdropUrl" value={backdropUrl} onChange={(event) => setBackdropUrl(event.target.value)} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="trailerUrl">Trailer (URL, m3u8 opcional)</Label>
        <Input id="trailerUrl" value={trailerUrl} onChange={(event) => setTrailerUrl(event.target.value)} />
      </div>

      <VideoTestField
        id="videoUrl"
        title="Video de la película"
        label="Video completo (URL, m3u8)"
        value={videoUrl}
        onChange={setVideoUrl}
        placeholder="https://.../master.m3u8"
      />

      {props.genres.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <Label>Géneros</Label>
          <div className="flex flex-wrap gap-2">
            {props.genres.map((genre) => (
              <button
                key={genre.id}
                type="button"
                onClick={() => toggleGenre(genre.id)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                  genreIds.includes(genre.id)
                    ? 'border-red-600 bg-red-600 text-white'
                    : 'border-white/15 bg-transparent text-white/60 hover:text-white',
                )}
              >
                {genre.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/5 p-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isPremium} onChange={(event) => setIsPremium(event.target.checked)} />
          Contenido premium
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isKids} onChange={(event) => setIsKids(event.target.checked)} />
          Apto para perfiles infantiles (Kids)
        </label>
      </div>

      <Button type="submit" disabled={saving || (!isEdit && !tenantId)} className="bg-red-600 text-white hover:bg-red-700">
        {saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear película'}
      </Button>
    </form>
  );
}
