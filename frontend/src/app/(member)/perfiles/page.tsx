'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { User, Baby, Trash2, Loader2, Plus, Pencil, ArrowLeft } from 'lucide-react';
import {
  useCreateProfile,
  useDeleteProfile,
  useProfiles,
  useUpdateProfile,
  useVerifyProfilePin,
} from '@/hooks/use-profiles';
import { selectActiveProfile } from '@/lib/auth/active-profile-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AvatarPicker } from '@/components/avatar-picker';
import { PinInput } from '@/components/pin-input';
import { useConfirmDialog } from '@/components/confirm-dialog';
import { defaultAvatarUrl } from '@/lib/profile-avatars';
import { gradientFor } from '@/lib/gradient';
import { cn } from '@/lib/utils';
import type { Profile } from '@/lib/api/types';

type ViewState = { kind: 'grid' } | { kind: 'edit'; profile: Profile } | { kind: 'create' } | { kind: 'pin'; profile: Profile };

export default function ProfilesPage() {
  const router = useRouter();
  const { data: profiles, isLoading } = useProfiles();
  const deleteProfile = useDeleteProfile();
  const [managing, setManaging] = useState(false);
  const [view, setView] = useState<ViewState>({ kind: 'grid' });
  const { confirm, ConfirmDialog } = useConfirmDialog();

  async function handleSelect(profile: Profile) {
    if (profile.hasPin) {
      setView({ kind: 'pin', profile });
      return;
    }
    await selectActiveProfile(profile.id);
    router.push('/continuar-viendo');
  }

  async function handlePinVerified(profile: Profile) {
    await selectActiveProfile(profile.id);
    router.push('/continuar-viendo');
  }

  async function handleDelete(id: string) {
    const ok = await confirm({
      title: '¿Eliminar este perfil?',
      description: 'Esta acción no se puede deshacer.',
      confirmLabel: 'Eliminar',
      destructive: true,
    });
    if (!ok) return;
    try {
      await deleteProfile.mutateAsync(id);
      setView({ kind: 'grid' });
    } catch {
      toast.error('No se pudo eliminar el perfil');
    }
  }

  if (view.kind === 'pin') {
    return <PinScreen profile={view.profile} onBack={() => setView({ kind: 'grid' })} onVerified={() => handlePinVerified(view.profile)} />;
  }

  if (view.kind === 'edit') {
    return (
      <>
        <ProfileForm
          profile={view.profile}
          onDone={() => setView({ kind: 'grid' })}
          onDelete={() => handleDelete(view.profile.id)}
        />
        {ConfirmDialog}
      </>
    );
  }

  if (view.kind === 'create') {
    return <ProfileForm onDone={() => setView({ kind: 'grid' })} nextAvatarIndex={profiles?.length ?? 0} />;
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center gap-10 py-10 text-center">
      <h1 className="text-3xl font-bold text-white sm:text-4xl">¿Quién está viendo?</h1>

      {isLoading ? (
        <Loader2 className="size-6 animate-spin text-white/50" />
      ) : (
        <div className="flex flex-wrap justify-center gap-6">
          {profiles?.map((profile) => (
            <button
              key={profile.id}
              type="button"
              onClick={() => (managing ? setView({ kind: 'edit', profile }) : handleSelect(profile))}
              className="group flex w-28 flex-col items-center gap-2 sm:w-32"
            >
              <div className="relative w-full">
                <div
                  className={cn(
                    'aspect-square w-full overflow-hidden rounded-xl ring-2 ring-transparent transition-all group-hover:ring-primary',
                    !profile.avatarUrl && `bg-gradient-to-br ${gradientFor(profile.id)}`,
                  )}
                >
                  {profile.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={profile.avatarUrl} alt={profile.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      {profile.isKids ? (
                        <Baby className="size-10 text-white/90" />
                      ) : (
                        <User className="size-10 text-white/90" />
                      )}
                    </div>
                  )}
                </div>
                {profile.isKids && (
                  <span className="pointer-events-none absolute left-1 top-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white/80">
                    Kids
                  </span>
                )}
                {managing && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/60">
                    <Pencil className="size-7 text-white" />
                  </div>
                )}
              </div>
              <p className="line-clamp-1 text-sm font-medium text-white/70 group-hover:text-white">{profile.name}</p>
            </button>
          ))}

          <button
            type="button"
            onClick={() => setView({ kind: 'create' })}
            className="flex w-28 flex-col items-center gap-2 sm:w-32"
          >
            <div className="flex aspect-square w-full items-center justify-center rounded-xl border-2 border-dashed border-white/25 text-white/40 transition-colors hover:border-white/50 hover:text-white/70">
              <Plus className="size-10" />
            </div>
            <p className="text-sm font-medium text-white/50">Nuevo perfil</p>
          </button>
        </div>
      )}

      <Button variant="outline" onClick={() => setManaging((m) => !m)}>
        {managing ? 'Listo' : 'Administrar perfiles'}
      </Button>
    </div>
  );
}

function PinScreen({ profile, onBack, onVerified }: { profile: Profile; onBack: () => void; onVerified: () => void }) {
  const verifyPin = useVerifyProfilePin();
  const [error, setError] = useState(false);

  function handleComplete(pin: string) {
    setError(false);
    verifyPin.mutate(
      { id: profile.id, pin },
      {
        onSuccess: () => onVerified(),
        onError: () => setError(true),
      },
    );
  }

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-6 py-16 text-center">
      <button
        type="button"
        onClick={onBack}
        className="self-start text-white/50 transition-colors hover:text-white"
        aria-label="Volver"
      >
        <ArrowLeft className="size-5" />
      </button>
      <p className="text-sm text-white/50">El bloqueo de perfil está activado.</p>
      <h1 className="text-2xl font-bold text-white">Ingresá tu PIN para acceder a &quot;{profile.name}&quot;</h1>
      <PinInput onComplete={handleComplete} error={error} disabled={verifyPin.isPending} />
      {error && <p className="text-sm text-red-500">PIN incorrecto. Probá de nuevo.</p>}
    </div>
  );
}

function ProfileForm({
  profile,
  onDone,
  onDelete,
  nextAvatarIndex = 0,
}: {
  profile?: Profile;
  onDone: () => void;
  onDelete?: () => void;
  nextAvatarIndex?: number;
}) {
  const isEdit = !!profile;
  const createProfile = useCreateProfile();
  const updateProfile = useUpdateProfile();

  const [name, setName] = useState(profile?.name ?? '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl ?? defaultAvatarUrl(nextAvatarIndex));
  const [isKids, setIsKids] = useState(profile?.isKids ?? false);
  const [pinEnabled, setPinEnabled] = useState(profile?.hasPin ?? false);
  const [pin, setPin] = useState('');

  const saving = createProfile.isPending || updateProfile.isPending;

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;

    const body = {
      name,
      avatarUrl,
      isKids,
      // pinCode: string nuevo si se activó/cambió; undefined = no tocar; '' no es válido acá.
      ...(pinEnabled && pin ? { pinCode: pin } : {}),
    };

    try {
      if (isEdit) {
        await updateProfile.mutateAsync({ id: profile.id, ...body });
        toast.success('Perfil actualizado');
      } else {
        await createProfile.mutateAsync(body);
        toast.success('Perfil creado');
      }
      onDone();
    } catch {
      toast.error(isEdit ? 'No se pudo actualizar el perfil' : 'No se pudo crear el perfil');
    }
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6 py-10">
      <button
        type="button"
        onClick={onDone}
        className="flex w-fit items-center gap-1.5 text-sm text-white/50 transition-colors hover:text-white"
      >
        <ArrowLeft className="size-4" />
        Volver
      </button>

      <h1 className="text-2xl font-bold text-white">{isEdit ? 'Editar perfil' : 'Nuevo perfil'}</h1>

      <form onSubmit={handleSave} className="flex flex-col gap-5">
        <div className="mx-auto aspect-square w-28 overflow-hidden rounded-xl ring-1 ring-white/15">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={avatarUrl} alt="Avatar seleccionado" className="h-full w-full object-cover" />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="profile-name">Nombre</Label>
          <Input id="profile-name" required value={name} onChange={(event) => setName(event.target.value)} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Elegí un avatar</Label>
          <AvatarPicker value={avatarUrl} onChange={setAvatarUrl} />
        </div>

        <label className="flex items-center gap-2 text-sm text-white/80">
          <input type="checkbox" checked={isKids} onChange={(event) => setIsKids(event.target.checked)} />
          Perfil infantil (contenido apto para niños)
        </label>

        <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
          <label className="flex items-center gap-2 text-sm text-white/80">
            <input
              type="checkbox"
              checked={pinEnabled}
              onChange={(event) => {
                setPinEnabled(event.target.checked);
                setPin('');
              }}
            />
            Bloquear este perfil con PIN
          </label>
          {pinEnabled && (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-white/50">
                {profile?.hasPin ? 'Ingresá un PIN nuevo para reemplazar el actual.' : 'Elegí un PIN de 4 dígitos.'}
              </p>
              <PinInput onComplete={setPin} />
              {pin && <p className="text-xs text-emerald-400">PIN listo para guardar.</p>}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3">
          {isEdit && onDelete && (
            <Button type="button" variant="ghost" className="gap-1.5 text-destructive" onClick={onDelete}>
              <Trash2 className="size-4" />
              Eliminar perfil
            </Button>
          )}
          <Button
            type="submit"
            disabled={saving || !name.trim() || (pinEnabled && !profile?.hasPin && !pin)}
            className="ml-auto bg-red-600 text-white hover:bg-red-700"
          >
            {saving ? 'Guardando…' : 'Guardar'}
          </Button>
        </div>
      </form>
    </div>
  );
}
