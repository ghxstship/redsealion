interface PortalPageProps {
  params: Promise<{ orgSlug: string }>;
}

export default async function PortalPage({ params }: PortalPageProps) {
  const { orgSlug } = await params;

  const orgName = orgSlug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  // Placeholder proposals — will be replaced with Supabase data
  const proposals = [
    {
      id: '1',
      name: 'Summer Brand Activation',
      status: 'In Review',
      updatedAt: 'Mar 28, 2026',
      value: '$48,500',
    },
    {
      id: '2',
      name: 'Product Launch Experience',
      status: 'Approved',
      updatedAt: 'Mar 15, 2026',
      value: '$124,000',
    },
    {
      id: '3',
      name: 'Holiday Pop-Up Installation',
      status: 'Draft',
      updatedAt: 'Mar 10, 2026',
      value: '$67,200',
    },
  ];

  return (
    <div className="space-y-10">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Welcome back
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          {orgName} Client Portal
        </p>
      </div>

      {/* Active Proposals */}
      <section>
        <h2 className="text-sm font-medium text-text-muted uppercase tracking-wider mb-4">
          Active Proposals
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {proposals.map((proposal) => (
            <div
              key={proposal.id}
              className="group rounded-lg border border-border bg-background p-5 transition-all duration-200 hover:border-text-muted hover:shadow-sm cursor-pointer"
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
                  <span className="text-text-secondary font-medium">{proposal.value}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-text-muted">Updated</span>
                  <span className="text-text-secondary">{proposal.updatedAt}</span>
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
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    'In Review': 'bg-amber-50 text-amber-700',
    Approved: 'bg-emerald-50 text-emerald-700',
    Draft: 'bg-bg-tertiary text-text-muted',
  };

  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium ${
        styles[status] ?? 'bg-bg-tertiary text-text-muted'
      }`}
    >
      {status}
    </span>
  );
}
