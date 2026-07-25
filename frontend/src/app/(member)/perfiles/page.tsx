'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { User, Baby, Trash2, Loader2 } from 'lucide-react';
import { useCreateProfile, useDeleteProfile, useProfiles } from '@/hooks/use-profiles';
import { selectActiveProfile } from '@/lib/auth/active-profile-actions';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ProfilesPage() {
  const router = useRouter();
  const { data: profiles, isLoading } = useProfiles();
  const createProfile = useCreateProfile();
  const deleteProfile = useDeleteProfile();
  const [name, setName] = useState('');
  const [isKids, setIsKids] = useState(false);

  async function handleSelect(profileId: string) {
    await selectActiveProfile(profileId);
    router.push('/continuar-viendo');
  }

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    try {
      await createProfile.mutateAsync({ name, isKids });
      setName('');
      setIsKids(false);
    } catch {
      toast.error('No se pudo crear el perfil');
    }
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <h1 className="text-2xl font-bold">¿Quién está viendo?</h1>

      {isLoading ? (
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {profiles?.map((profile) => (
            <Card key={profile.id} className="group relative">
              <CardContent
                className="flex cursor-pointer flex-col items-center gap-2 py-6"
                onClick={() => handleSelect(profile.id)}
              >
                <div className="flex size-16 items-center justify-center rounded-full bg-muted">
                  {profile.isKids ? <Baby className="size-8" /> : <User className="size-8" />}
                </div>
                <p className="text-sm font-medium">{profile.name}</p>
              </CardContent>
              <Button
                size="icon-sm"
                variant="ghost"
                className="absolute right-1 top-1 opacity-0 group-hover:opacity-100"
                onClick={(event) => {
                  event.stopPropagation();
                  deleteProfile.mutate(profile.id);
                }}
              >
                <Trash2 className="size-4" />
              </Button>
            </Card>
          ))}
        </div>
      )}

      <form onSubmit={handleCreate} className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-end">
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="profile-name">Nuevo perfil</Label>
          <Input id="profile-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Nombre" />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isKids} onChange={(event) => setIsKids(event.target.checked)} />
          Perfil infantil
        </label>
        <Button type="submit" disabled={createProfile.isPending}>
          {createProfile.isPending ? 'Creando…' : 'Agregar perfil'}
        </Button>
      </form>
    </div>
  );
}
