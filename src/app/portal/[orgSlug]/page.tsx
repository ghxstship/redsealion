import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { formatCurrency, statusColor } from '@/lib/utils';
import EmptyState from '@/components/ui/EmptyState';

interface PortalPageProps {
  params: Promise<{ orgSlug: string }>;
}

export default async function PortalPage({ params }: PortalPageProps) {
  const { orgSlug } = await params;

  const supabase = await createClient();

  // Look up the organization by slug
  const { data: org } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('slug', orgSlug)
    .single();

  if (!org) {
    redirect('/');
  }

  // Fetch proposals for this organization that have portal access (sent to client)
  const { data: proposals } = await supabase
    .from('proposals')
    .select('id, name, status, total_value, currency, updated_at, portal_access_token')
    .eq('organization_id', org.id)
    .not('portal_access_token', 'is', null)
    .order('updated_at', { ascending: false });

  const proposalList = proposals ?? [];

  return (
    <div className="space-y-10">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Welcome back
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          {org.name} Client Portal
        </p>
      </div>

      {/* Active Proposals */}
      <section>
        <h2 className="text-sm font-medium text-text-muted uppercase tracking-wider mb-4">
          Active Proposals
        </h2>

        {proposalList.length === 0 ? (
          <EmptyState
            message="No proposals available yet"
            description="Proposals will appear here once they have been shared with you."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {proposalList.map((proposal) => (
              <Link
                key={proposal.id}
                href={`/portal/${orgSlug}/proposals/${proposal.id}`}
                className="group rounded-lg border border-border bg-background p-5 transition-[color,background-color,border-color,opacity,box-shadow] duration-normal hover:border-text-muted hover:shadow-sm"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-sm font-medium text-foreground leading-snug pr-3">
                    {proposal.name}
                  </h3>
                  <StatusBadge status={proposal.status} />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-text-muted">Value</span>
                    <span className="text-text-secondary font-medium">
                      {formatCurrency(proposal.total_value, proposal.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-text-muted">Updated</span>
                    <span className="text-text-secondary">
                      {new Date(proposal.updated_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-border">
                  <span
                    className="text-xs font-medium transition-colors"
                    style={{ color: 'var(--org-primary)' }}
                  >
                    View proposal
                    <span className="inline-block ml-1 transition-transform group-hover:translate-x-0.5">
                      &rarr;
                    </span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const label = status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium ${statusColor(status)}`}
    >
      {label}
    </span>
  );
}
