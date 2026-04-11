import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge, { GENERIC_STATUS_COLORS } from '@/components/ui/StatusBadge';
import { Star } from 'lucide-react';
import Link from 'next/link';
import FavoriteButton from '@/components/shared/FavoriteButton';

type EntityConfig = {
  table: string;
  nameField: string;
  hrefBase: string;
  label: string;
};

const ENTITY_CONFIGS: Record<string, EntityConfig> = {
  proposals: { table: 'proposals', nameField: 'name', hrefBase: '/app/proposals', label: 'Proposals' },
  events: { table: 'events', nameField: 'name', hrefBase: '/app/events', label: 'Events' },
  tasks: { table: 'tasks', nameField: 'title', hrefBase: '/app/tasks', label: 'Tasks' },
  clients: { table: 'clients', nameField: 'company_name', hrefBase: '/app/clients', label: 'Clients' },
  projects: { table: 'projects', nameField: 'name', hrefBase: '/app/projects', label: 'Projects' },
  equipment: { table: 'assets', nameField: 'name', hrefBase: '/app/equipment', label: 'Equipment' },
  deals: { table: 'deals', nameField: 'title', hrefBase: '/app/pipeline', label: 'Deals' },
  invoices: { table: 'invoices', nameField: 'invoice_number', hrefBase: '/app/invoices', label: 'Invoices' },
};

async function getFavoritedItems() {
  const supabase = await createClient();
  const ctx = await resolveCurrentOrg();
  if (!ctx) return {};

  const { data: favorites } = await supabase
    .from('favorites')
    .select('entity_type, entity_id, created_at')
    .eq('user_id', ctx.userId)
    .eq('organization_id', ctx.organizationId)
    .order('created_at', { ascending: false });

  if (!favorites || favorites.length === 0) return {};

  // Group by entity_type
  const grouped = favorites.reduce((acc, curr) => {
    if (!acc[curr.entity_type]) acc[curr.entity_type] = [];
    acc[curr.entity_type].push(curr.entity_id);
    return acc;
  }, {} as Record<string, string[]>);

  const buckets: Record<string, any[]> = {};

  // Fetch actual entity data mapped to each bucket
  await Promise.all(
    Object.entries(grouped).map(async ([entityType, ids]) => {
      const config = ENTITY_CONFIGS[entityType];
      if (!config) return;

      const { data } = await supabase
        .from(config.table)
        .select(`id, ${config.nameField}, status`)
        .in('id', ids);

      if (data) {
        // Sort data matching the recent favorites order
        const sortedData = data.sort((a, b) => {
          return ids.indexOf(a.id) - ids.indexOf(b.id);
        });
        buckets[entityType] = sortedData;
      }
    })
  );

  return buckets;
}

export default async function FavoritesPage() {
  const data = await getFavoritedItems();
  const validKeys = Object.keys(data).filter(key => ENTITY_CONFIGS[key] && data[key].length > 0);

  return (
    <div>
      <PageHeader title="Favorites" subtitle="Quick access to your starred items across the platform." />

      {validKeys.length === 0 ? (
        <div className="mt-8 rounded-xl border border-border bg-background px-5 py-16 text-center">
          <Star className="w-10 h-10 text-text-muted mx-auto mb-4" />
          <h2 className="text-sm font-medium text-foreground mb-1">No favorites yet</h2>
          <p className="text-xs text-text-secondary max-w-sm mx-auto">
            You haven&apos;t starred any items yet. Look for the star icon across the platform to save quick links here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {validKeys.map((key) => {
            const config = ENTITY_CONFIGS[key];
            const items = data[key];
            
            return (
              <div key={key} className="rounded-xl border border-border bg-background overflow-hidden relative">
                <div className="px-5 py-3 bg-bg-secondary border-b border-border flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider">{config.label}</h3>
                  <Link href={config.hrefBase} className="text-xs font-medium text-blue-600 hover:underline">View all</Link>
                </div>
                
                <div className="divide-y divide-border">
                  {items.map((item: Record<string, unknown>) => (
                    <div key={item.id as string} className="flex items-center group hover:bg-bg-secondary/50 transition-colors">
                      <Link href={`${config.hrefBase}/${item.id}`} className="flex-1 px-5 py-3 block">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-foreground">{item[config.nameField] as string}</p>
                          {(item.status as string) && (
                            <StatusBadge status={item.status as string} colorMap={GENERIC_STATUS_COLORS} />
                          )}
                        </div>
                      </Link>
                      <div className="px-5">
                        <FavoriteButton entityType={key} entityId={item.id as string} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
