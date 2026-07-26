'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ChevronDown, ChevronUp, Pencil, Plus, Trash2 } from 'lucide-react';
import { clientFetch } from '@/lib/api/client';
import type { Season, Episode } from '@/lib/api/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { VideoTestFieldCompact } from '@/components/admin/video-test-field';
import { cn } from '@/lib/utils';

export function SeasonsManager({ seriesId, seasons }: { seriesId: string; seasons: Season[] }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [editingSeasonId, setEditingSeasonId] = useState<string | null>(null);
  const [newSeasonNumber, setNewSeasonNumber] = useState(String(seasons.length + 1));
  const [newSeasonTitle, setNewSeasonTitle] = useState('');
  const [creatingSeason, setCreatingSeason] = useState(false);

  async function handleCreateSeason(event: React.FormEvent) {
    event.preventDefault();
    setCreatingSeason(true);
    try {
      await clientFetch(`/series/${seriesId}/seasons`, {
        method: 'POST',
        body: JSON.stringify({ number: Number(newSeasonNumber), title: newSeasonTitle || undefined }),
      });
      toast.success('Temporada creada');
      setNewSeasonTitle('');
      setNewSeasonNumber(String(seasons.length + 2));
      router.refresh();
    } catch {
      toast.error('No se pudo crear la temporada');
    } finally {
      setCreatingSeason(false);
    }
  }

  async function handleDeleteSeason(seasonId: string, label: string) {
    if (!confirm(`¿Eliminar "${label}" y todos sus episodios?`)) return;
    try {
      await clientFetch(`/series/${seriesId}/seasons/${seasonId}`, { method: 'DELETE' });
      toast.success('Temporada eliminada');
      router.refresh();
    } catch {
      toast.error('No se pudo eliminar la temporada');
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-bold text-white">Temporadas y episodios</h2>

      {seasons.length === 0 ? (
        <p className="text-sm text-white/50">Todavía no hay temporadas.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {seasons.map((season) =>
            editingSeasonId === season.id ? (
              <SeasonEditForm
                key={season.id}
                seriesId={seriesId}
                season={season}
                onDone={() => {
                  setEditingSeasonId(null);
                  router.refresh();
                }}
                onCancel={() => setEditingSeasonId(null)}
              />
            ) : (
              <div key={season.id} className="overflow-hidden rounded-xl border border-white/10 bg-white/5">
                <div className="flex items-center justify-between p-3">
                  <button
                    type="button"
                    onClick={() => setExpanded((prev) => ({ ...prev, [season.id]: !prev[season.id] }))}
                    className="flex items-center gap-2 text-sm font-semibold text-white"
                  >
                    {expanded[season.id] ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                    {season.title ?? `Temporada ${season.number}`}
                    <span className="text-xs font-normal text-white/40">
                      ({(season.episodes ?? []).length} episodios)
                    </span>
                  </button>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => setEditingSeasonId(season.id)}
                      className="text-white/50 hover:bg-white/10 hover:text-white"
                      aria-label="Editar temporada"
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => handleDeleteSeason(season.id, season.title ?? `Temporada ${season.number}`)}
                      className="text-white/50 hover:bg-destructive/10 hover:text-destructive"
                      aria-label="Eliminar temporada"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>

                {expanded[season.id] && (
                  <div className="border-t border-white/10 p-3">
                    <EpisodesList seriesId={seriesId} seasonId={season.id} episodes={season.episodes ?? []} />
                  </div>
                )}
              </div>
            ),
          )}
        </div>
      )}

      <form
        onSubmit={handleCreateSeason}
        className="flex flex-wrap items-end gap-3 rounded-xl border border-white/10 bg-white/5 p-4"
      >
        <div className="flex w-20 flex-col gap-1.5">
          <Label htmlFor="season-number">N°</Label>
          <Input
            id="season-number"
            type="number"
            min={0}
            required
            value={newSeasonNumber}
            onChange={(event) => setNewSeasonNumber(event.target.value)}
          />
        </div>
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="season-title">Título (opcional)</Label>
          <Input
            id="season-title"
            value={newSeasonTitle}
            onChange={(event) => setNewSeasonTitle(event.target.value)}
            placeholder="Temporada 1"
          />
        </div>
        <Button type="submit" disabled={creatingSeason} variant="outline" className="gap-1.5">
          <Plus className="size-4" />
          Agregar temporada
        </Button>
      </form>
    </div>
  );
}

function SeasonEditForm({
  seriesId,
  season,
  onDone,
  onCancel,
}: {
  seriesId: string;
  season: Season;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [number, setNumber] = useState(String(season.number));
  const [title, setTitle] = useState(season.title ?? '');
  const [saving, setSaving] = useState(false);

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      await clientFetch(`/series/${seriesId}/seasons/${season.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ number: Number(number), title: title || undefined }),
      });
      toast.success('Temporada actualizada');
      onDone();
    } catch {
      toast.error('No se pudo actualizar la temporada');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSave}
      className="flex flex-wrap items-end gap-3 rounded-xl border border-red-600/40 bg-white/5 p-4"
    >
      <div className="flex w-20 flex-col gap-1.5">
        <Label htmlFor={`season-number-${season.id}`}>N°</Label>
        <Input
          id={`season-number-${season.id}`}
          type="number"
          min={0}
          required
          value={number}
          onChange={(event) => setNumber(event.target.value)}
        />
      </div>
      <div className="flex flex-1 flex-col gap-1.5">
        <Label htmlFor={`season-title-${season.id}`}>Título (opcional)</Label>
        <Input
          id={`season-title-${season.id}`}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Temporada 1"
        />
      </div>
      <Button type="submit" size="sm" disabled={saving} className="bg-red-600 text-white hover:bg-red-700">
        {saving ? 'Guardando…' : 'Guardar'}
      </Button>
      <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
        Cancelar
      </Button>
    </form>
  );
}

function EpisodesList({
  seriesId,
  seasonId,
  episodes,
}: {
  seriesId: string;
  seasonId: string;
  episodes: Episode[];
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [editingEpisodeId, setEditingEpisodeId] = useState<string | null>(null);

  async function handleDeleteEpisode(episodeId: string, label: string) {
    if (!confirm(`¿Eliminar el episodio "${label}"?`)) return;
    try {
      await clientFetch(`/series/${seriesId}/seasons/${seasonId}/episodes/${episodeId}`, { method: 'DELETE' });
      toast.success('Episodio eliminado');
      router.refresh();
    } catch {
      toast.error('No se pudo eliminar el episodio');
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {episodes.length === 0 ? (
        <p className="text-xs text-white/40">Sin episodios todavía.</p>
      ) : (
        episodes.map((episode) =>
          editingEpisodeId === episode.id ? (
            <EpisodeForm
              key={episode.id}
              seriesId={seriesId}
              seasonId={seasonId}
              episode={episode}
              onDone={() => {
                setEditingEpisodeId(null);
                router.refresh();
              }}
              onCancel={() => setEditingEpisodeId(null)}
            />
          ) : (
            <div
              key={episode.id}
              className="flex items-center justify-between gap-2 rounded-lg bg-black/30 px-3 py-2 text-sm"
            >
              <span className="text-white/85">
                {episode.number}. {episode.title}
                {!episode.videoUrl && <span className="ml-2 text-xs text-amber-400">sin video</span>}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => setEditingEpisodeId(episode.id)}
                  className="text-white/40 hover:bg-white/10 hover:text-white"
                  aria-label="Editar episodio"
                >
                  <Pencil className="size-3.5" />
                </Button>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => handleDeleteEpisode(episode.id, episode.title)}
                  className="text-white/40 hover:bg-destructive/10 hover:text-destructive"
                  aria-label="Eliminar episodio"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
          ),
        )
      )}

      {adding ? (
        <EpisodeForm
          seriesId={seriesId}
          seasonId={seasonId}
          defaultNumber={episodes.length + 1}
          onDone={() => {
            setAdding(false);
            router.refresh();
          }}
          onCancel={() => setAdding(false)}
        />
      ) : (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setAdding(true)}
          className="mt-1 w-fit gap-1.5"
        >
          <Plus className="size-3.5" />
          Agregar episodio
        </Button>
      )}
    </div>
  );
}

// Formulario compartido para crear o editar un episodio (número, título, sinopsis,
// video m3u8 con "Probar", duración y miniatura).
function EpisodeForm({
  seriesId,
  seasonId,
  episode,
  defaultNumber,
  onDone,
  onCancel,
}: {
  seriesId: string;
  seasonId: string;
  episode?: Episode;
  defaultNumber?: number;
  onDone: () => void;
  onCancel: () => void;
}) {
  const isEdit = !!episode;
  const [number, setNumber] = useState(String(episode?.number ?? defaultNumber ?? 1));
  const [title, setTitle] = useState(episode?.title ?? '');
  const [synopsis, setSynopsis] = useState(episode?.synopsis ?? '');
  const [videoUrl, setVideoUrl] = useState(episode?.videoUrl ?? '');
  const [thumbnailUrl, setThumbnailUrl] = useState(episode?.thumbnailUrl ?? '');
  const [durationMinutes, setDurationMinutes] = useState(episode?.durationMinutes?.toString() ?? '');
  const [saving, setSaving] = useState(false);

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const body = {
        number: Number(number),
        title,
        synopsis: synopsis || undefined,
        videoUrl: videoUrl || undefined,
        thumbnailUrl: thumbnailUrl || undefined,
        durationMinutes: durationMinutes ? Number(durationMinutes) : undefined,
      };
      if (isEdit) {
        await clientFetch(`/series/${seriesId}/seasons/${seasonId}/episodes/${episode.id}`, {
          method: 'PATCH',
          body: JSON.stringify(body),
        });
        toast.success('Episodio actualizado');
      } else {
        await clientFetch(`/series/${seriesId}/seasons/${seasonId}/episodes`, {
          method: 'POST',
          body: JSON.stringify(body),
        });
        toast.success('Episodio creado');
      }
      onDone();
    } catch {
      toast.error(isEdit ? 'No se pudo actualizar el episodio' : 'No se pudo crear el episodio');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSave}
      className={cn(
        'mt-2 flex flex-col gap-2 rounded-lg bg-black/30 p-3',
        isEdit && 'ring-1 ring-red-600/40',
      )}
    >
      <div className="flex gap-2">
        <Input
          type="number"
          min={0}
          required
          value={number}
          onChange={(event) => setNumber(event.target.value)}
          className="w-16"
          placeholder="N°"
        />
        <Input
          required
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Título del episodio"
          className="flex-1"
        />
        <Input
          type="number"
          min={1}
          value={durationMinutes}
          onChange={(event) => setDurationMinutes(event.target.value)}
          placeholder="Min"
          className="w-20"
        />
      </div>
      <textarea
        value={synopsis}
        onChange={(event) => setSynopsis(event.target.value)}
        placeholder="Sinopsis del episodio (opcional)"
        rows={2}
        className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring"
      />
      <VideoTestFieldCompact value={videoUrl} onChange={setVideoUrl} placeholder="Video (URL, m3u8)" />
      <Input
        value={thumbnailUrl}
        onChange={(event) => setThumbnailUrl(event.target.value)}
        placeholder="Miniatura del episodio (URL de imagen, opcional)"
      />
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={saving} className="bg-red-600 text-white hover:bg-red-700">
          {saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Guardar episodio'}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
