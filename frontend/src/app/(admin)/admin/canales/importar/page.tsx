import { getCurrentUser } from '@/lib/auth/get-current-user';
import { serverFetch } from '@/lib/api/server';
import type { Paginated, Tenant } from '@/lib/api/types';
import { ImportChannelsForm } from './import-channels-form';

export default async function ImportChannelsPage() {
  const user = await getCurrentUser();
  const tenants = await serverFetch<Paginated<Tenant>>('/tenants?limit=100', { withTenant: false });

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-2 text-2xl font-bold">Importar canales desde M3U</h1>
      <p className="mb-6 text-sm text-white/60">
        Pegá el contenido de una playlist M3U/M3U8 extendida (líneas <code>#EXTINF</code> con
        nombre, logo y categoría, seguidas de la URL del stream). Un canal que ya existe con el
        mismo nombre se actualiza en vez de duplicarse — sirve para refrescar URLs vencidas.
      </p>
      <ImportChannelsForm tenants={tenants.data} defaultTenantId={user?.tenant?.id ?? null} />
    </div>
  );
}
