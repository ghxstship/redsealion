import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { TierGate } from '@/components/shared/TierGate';
import AdvancingHeader from '@/components/admin/advances/AdvancingHeader';
import AdvancingListClient from '@/components/admin/advances/AdvancingListClient';

async function getAdvances() {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return [];

    const { data } = await supabase
      .from('production_advances')
      .select('*, projects(name)')
      .eq('organization_id', ctx.organizationId)
      .order('created_at', { ascending: false });

    if (!data) return [];

    return data.map((row: Record<string, unknown>) => ({
      id: row.id as string,
      advance_number: row.advance_number as string,
      advance_mode: (row.advance_mode as string) as import('@/types/database').AdvanceMode,
      advance_type: (row.advance_type as string) as import('@/types/database').AdvanceType,
      status: (row.status as string) as import('@/types/database').AdvanceStatus,
      priority: ((row.priority as string) ?? 'medium') as import('@/types/database').AdvancePriority,
      event_name: row.event_name as string | null,
      venue_name: row.venue_name as string | null,
      service_start_date: row.service_start_date as string | null,
      service_end_date: row.service_end_date as string | null,
      total_cents: (row.total_cents as number) ?? 0,
      line_item_count: (row.line_item_count as number) ?? 0,
      submission_deadline: row.submission_deadline as string | null,
      created_at: row.created_at as string,
      projects: row.projects as { name: string } | null,
    }));
  } catch {
    return [];
  }
}

export default async function AdvancingPage() {
  const advances = await getAdvances();

  const statusCounts = advances.reduce(
    (acc, a) => { acc[a.status] = (acc[a.status] ?? 0) + 1; return acc; },
    {} as Record<string, number>,
  );

  return (
    <TierGate feature="work_orders">
      <AdvancingHeader />

      {/* Summary stat cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mt-6 mb-8">
        {[
          { label: 'Total', value: advances.length },
          { label: 'Draft', value: statusCounts.draft ?? 0 },
          { label: 'In Review', value: (statusCounts.submitted ?? 0) + (statusCounts.under_review ?? 0) },
          { label: 'Approved', value: statusCounts.approved ?? 0 },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-white p-4">
            <p className="text-xs text-text-muted">{stat.label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{stat.value}</p>
          </div>
        ))}
      </div>

      <AdvancingListClient advances={advances} />
    </TierGate>
  );
}
