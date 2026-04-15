import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { formatCurrency } from '@/lib/utils';
import EmptyState from '@/components/ui/EmptyState';
import StatusBadge, { GENERIC_STATUS_COLORS } from '@/components/ui/StatusBadge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Value</TableHead>
                <TableHead className="text-right">Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(proposals ?? []).map((proposal) => (
                <TableRow key={proposal.id}>
                  <TableCell className="font-medium text-foreground">{proposal.name}</TableCell>
                  <TableCell>
                    <StatusBadge status={proposal.status} colorMap={GENERIC_STATUS_COLORS} />
                  </TableCell>
                  <TableCell className="text-right text-text-secondary">
                    {formatCurrency(proposal.total_value, proposal.currency)}
                  </TableCell>
                  <TableCell className="text-right text-text-muted text-xs">
                    {new Date(proposal.updated_at).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                    })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
