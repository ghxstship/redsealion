import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import { formatCurrency }  from '@/lib/utils';
import Link from 'next/link';
import StatusBadge, { ADVANCE_STATUS_COLORS } from '@/components/ui/StatusBadge';
import AdvancingHubTabs from '../../AdvancingHubTabs';
import MetricCard from '@/components/ui/MetricCard';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';

async function getSubmissions() {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return [];

    const { data } = await supabase
      .from('production_advances')
      .select('id, advance_number, event_name, status, total_cents, created_at, submission_deadline')
      .eq('organization_id', ctx.organizationId)
      .in('status', ['draft', 'submitted'])
      .order('submission_deadline', { ascending: true })
      .range(0, 99);

    return (data ?? []) as Array<{
      id: string; advance_number: string; event_name: string | null;
      status: string; total_cents: number; created_at: string; submission_deadline: string | null;
    }>;
  } catch { return []; }
}

export default async function AdvancingSubmissionsPage() {
  const submissions = await getSubmissions();

  const drafts = submissions.filter((s) => s.status === 'draft');
  const submitted = submissions.filter((s) => s.status === 'submitted');

  return (
    <TierGate feature="work_orders">
      <PageHeader title="Submissions" subtitle="Submit and track production advance requests." />
      <AdvancingHubTabs />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 mb-8">
        <MetricCard label={"Total"} value={submissions.length} />
        <MetricCard label={"Drafts"} value={drafts.length} className="[&_.text-foreground]:text-yellow-600" />
        <MetricCard label={"Submitted"} value={submitted.length} className="[&_.text-foreground]:text-blue-600" />
      </div>

      <div className="rounded-xl border border-border bg-background overflow-hidden">
        {submissions.length === 0 ? (
          <div className="px-8 py-16 text-center">
            <p className="text-sm text-text-secondary">No pending submissions. Create a new advance to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table >
              <TableHeader >
                <TableRow>
                  <TableHead className="px-4 py-3">Number</TableHead>
                  <TableHead className="px-4 py-3">Event</TableHead>
                  <TableHead className="px-4 py-3">Status</TableHead>
                  <TableHead className="px-4 py-3">Amount</TableHead>
                  <TableHead className="px-4 py-3">Deadline</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody >
                {submissions.map((item) => (
                  <TableRow key={item.id} className="hover:bg-bg-secondary/50 transition-colors">
                    <TableCell className="px-4 py-3">
                      <Link href={`/app/advancing/${item.id}`} className="font-medium text-foreground hover:underline">
                        {item.advance_number}
                      </Link>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-text-secondary">{item.event_name ?? '—'}</TableCell>
                    <TableCell className="px-4 py-3">
                      <StatusBadge status={item.status} colorMap={ADVANCE_STATUS_COLORS} />
                    </TableCell>
                    <TableCell className="px-4 py-3 tabular-nums">{formatCurrency(item.total_cents / 100)}</TableCell>
                    <TableCell className="px-4 py-3 text-text-secondary">{item.submission_deadline ? new Date(item.submission_deadline).toLocaleDateString() : '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </TierGate>
  );
}
