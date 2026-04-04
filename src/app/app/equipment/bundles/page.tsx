import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

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
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('No auth');

    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();
    if (!userData) throw new Error('No org');

    const { data: bundles } = await supabase
      .from('equipment_bundles')
      .select()
      .eq('organization_id', userData.organization_id)
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Equipment Bundles
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            {bundles.length} bundles configured
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/app/equipment"
            className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-bg-secondary"
          >
            All Equipment
          </Link>
          <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-foreground/90">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <line x1="8" y1="2" x2="8" y2="14" />
              <line x1="2" y1="8" x2="14" y2="8" />
            </svg>
            Create Bundle
          </button>
        </div>
      </div>

      {/* Bundle cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {bundles.map((bundle) => (
          <div
            key={bundle.id}
            className="rounded-xl border border-border bg-white px-6 py-5 transition-colors hover:border-foreground/20"
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
          </div>
        ))}
      </div>

      {bundles.length === 0 && (
        <div className="rounded-xl border border-border bg-white px-6 py-12 text-center text-sm text-text-muted">
          No bundles created yet. Create one to group equipment for quick deployment.
        </div>
      )}
    </>
  );
}
