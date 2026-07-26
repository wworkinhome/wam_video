import { serverFetch } from '@/lib/api/server';
import type { Channel } from '@/lib/api/types';
import { ChannelForm } from '../../channel-form';

export default async function EditChannelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const channel = await serverFetch<Channel>(`/channels/${id}`, { withTenant: false });

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-6 text-2xl font-bold">Editar canal</h1>
      <ChannelForm mode="edit" channel={channel} />
    </div>
  );
}
