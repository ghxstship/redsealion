import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { formatCurrency } from '@/lib/utils';
import EmptyState from '@/components/ui/EmptyState';
import StatusBadge, { GENERIC_STATUS_COLORS } from '@/components/ui/StatusBadge';
import type { Metadata } from 'next';

interface ViewerProposalsProps {
  params: Promise<{ orgSlug: string }>;
}

export async function generateMetadata({ params }: ViewerProposalsProps): Promise<Metadata> {
  const { orgSlug } = await params;
  return { title: `Proposals | Viewer Portal | ${orgSlug}` };
}

export default async function ViewerProposalsPage({ params }: ViewerProposalsProps) {
  const { orgSlug } = await params;
  const supabase = await createClient();

  const { data: org } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('slug', orgSlug)
    .single();
  if (!org) redirect('/');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/portal/${orgSlug}/login`);

  const { data: proposals } = await supabase
    .from('proposals')
    .select('id, name, status, total_value, currency, updated_at, created_at')
    .eq('organization_id', org.id)
    .order('updated_at', { ascending: false })
    .limit(100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Proposals</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Read-only view of all organization proposals.
        </p>
      </div>

      {(proposals ?? []).length === 0 ? (
        <EmptyState message="No proposals" description="No proposals have been created yet." />
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-bg-secondary">
                <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Name</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Status</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Value</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(proposals ?? []).map((proposal) => (
                <tr key={proposal.id} className="hover:bg-bg-secondary/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{proposal.name}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={proposal.status} colorMap={GENERIC_STATUS_COLORS} />
                  </td>
                  <td className="px-4 py-3 text-right text-text-secondary">
                    {formatCurrency(proposal.total_value, proposal.currency)}
                  </td>
                  <td className="px-4 py-3 text-right text-text-muted text-xs">
                    {new Date(proposal.updated_at).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
