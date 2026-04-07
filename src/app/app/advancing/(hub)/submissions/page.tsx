import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import { formatCurrency }  from '@/lib/utils';
import Link from 'next/link';
import AdvancingHubTabs from '../../AdvancingHubTabs';

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
      .order('submission_deadline', { ascending: true });

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
        <div className="rounded-xl border border-border bg-white p-4">
          <p className="text-xs text-text-muted">Total</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{submissions.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-white p-4">
          <p className="text-xs text-text-muted">Drafts</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-yellow-600">{drafts.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-white p-4">
          <p className="text-xs text-text-muted">Submitted</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-blue-600">{submitted.length}</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-white overflow-hidden">
        {submissions.length === 0 ? (
          <div className="px-8 py-16 text-center">
            <p className="text-sm text-text-secondary">No pending submissions. Create a new advance to get started.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-bg-secondary text-left text-xs font-medium text-text-muted uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Number</th>
                <th className="px-4 py-3">Event</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Deadline</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {submissions.map((item) => (
                <tr key={item.id} className="hover:bg-bg-secondary/50 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/app/advancing/${item.id}`} className="font-medium text-foreground hover:underline">
                      {item.advance_number}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{item.event_name ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${item.status === 'draft' ? 'bg-yellow-50 text-yellow-700' : 'bg-blue-50 text-blue-700'}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 tabular-nums">{formatCurrency(item.total_cents / 100)}</td>
                  <td className="px-4 py-3 text-text-secondary">{item.submission_deadline ? new Date(item.submission_deadline).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </TierGate>
  );
}
