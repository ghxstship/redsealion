import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import EmptyState from '@/components/ui/EmptyState';
import PageHeader from '@/components/shared/PageHeader';
import Card from '@/components/ui/Card';
import BundlesHeader from '@/components/admin/equipment/BundlesHeader';
import EquipmentHubTabs from '../../EquipmentHubTabs';

interface Bundle {
  id: string;
  name: string;
  description: string | null;
  item_count: number;
  category: string;
  created_at: string;
}

const fallbackBundles: Bundle[] = [
  { id: 'bnd_001', name: 'Stage Lighting Kit A', description: 'Standard concert lighting package with movers and washes', item_count: 24, category: 'Lighting', created_at: '2026-01-10' },
  { id: 'bnd_002', name: 'Corporate AV Package', description: 'Projector, screen, audio, and podium mic setup', item_count: 12, category: 'AV', created_at: '2026-02-05' },
  { id: 'bnd_003', name: 'Festival Sound System', description: 'Main PA with subs, monitors, and mixing desk', item_count: 36, category: 'Audio', created_at: '2025-11-20' },
  { id: 'bnd_004', name: 'LED Wall 20x10', description: '20ft by 10ft LED wall with processors and cabling', item_count: 48, category: 'LED', created_at: '2026-03-01' },
  { id: 'bnd_005', name: 'Rigging Kit - Medium Venue', description: 'Chain hoists, truss, and hardware for mid-size venues', item_count: 18, category: 'Rigging', created_at: '2025-09-15' },
];

async function getBundles(): Promise<Bundle[]> {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) throw new Error('No auth');
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('No auth');
const { data: bundles } = await supabase
      .from('equipment_bundles')
      .select()
      .eq('organization_id', ctx.organizationId)
      .order('name');

    if (!bundles || bundles.length === 0) throw new Error('No bundles');

    return bundles.map((b: Record<string, unknown>) => ({
      id: b.id as string,
      name: b.name as string,
      description: (b.description as string) ?? null,
      item_count: (b.item_count as number) ?? 0,
      category: (b.category as string) ?? 'General',
      created_at: b.created_at as string,
    }));
  } catch {
    return fallbackBundles;
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default async function BundlesPage() {
  const bundles = await getBundles();

  return (
    <>
      {/* Header */}
      <PageHeader
        title="Bundles"
        subtitle={`${bundles.length} bundles configured`}
      >
        <BundlesHeader />
      </PageHeader>

      <EquipmentHubTabs />

      {/* Bundle cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {bundles.map((bundle) => (
          <Card
            key={bundle.id}
            className="transition-colors hover:border-foreground/20"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {bundle.name}
                </p>
                {bundle.description && (
                  <p className="mt-1 text-xs text-text-muted line-clamp-2">
                    {bundle.description}
                  </p>
                )}
              </div>
              <span className="inline-flex shrink-0 items-center rounded-full bg-bg-secondary px-2.5 py-0.5 text-xs font-medium text-text-secondary">
                {bundle.category}
              </span>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <p className="text-lg font-semibold tabular-nums text-foreground">
                {bundle.item_count} items
              </p>
              <p className="text-xs text-text-muted">
                Created {formatDate(bundle.created_at)}
              </p>
            </div>
          </Card>
        ))}
      </div>

      {bundles.length === 0 && (
        <EmptyState
          message="No bundles created yet"
          description="Create one to group equipment for quick deployment."
        />
      )}
    </>
  );
}
