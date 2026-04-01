import Link from 'next/link';
import { formatCurrency, statusColor } from '@/lib/utils';

const clientsData: Record<string, {
  company_name: string;
  industry: string;
  tags: string[];
  billing_address: string;
  source: string;
  contacts: Array<{
    id: string;
    name: string;
    title: string;
    email: string;
    phone: string;
    role: string;
    is_decision_maker: boolean;
  }>;
  proposals: Array<{
    id: string;
    name: string;
    status: string;
    total_value: number;
    prepared_date: string;
  }>;
  activity: Array<{
    id: string;
    action: string;
    detail: string;
    date: string;
  }>;
}> = {
  client_001: {
    company_name: 'Nike',
    industry: 'Sportswear & Apparel',
    tags: ['enterprise', 'repeat'],
    billing_address: 'One Bowerman Drive, Beaverton, OR 97005',
    source: 'Referral',
    contacts: [
      { id: 'cc_001', name: 'Sarah Chen', title: 'VP Brand Experience', email: 'sarah.chen@nike.com', phone: '+1 503 555 0101', role: 'primary', is_decision_maker: true },
      { id: 'cc_002', name: 'Marcus Rivera', title: 'Senior Event Manager', email: 'marcus.r@nike.com', phone: '+1 503 555 0102', role: 'operations', is_decision_maker: false },
      { id: 'cc_003', name: 'Aiko Tanaka', title: 'Finance Director', email: 'aiko.tanaka@nike.com', phone: '+1 503 555 0103', role: 'billing', is_decision_maker: false },
    ],
    proposals: [
      { id: 'prop_001', name: 'Nike Air Max Experience', status: 'draft', total_value: 185000, prepared_date: '2026-03-28T00:00:00Z' },
      { id: 'prop_005', name: 'Nike SNKRS Fest 2026', status: 'in_production', total_value: 425000, prepared_date: '2026-01-15T00:00:00Z' },
    ],
    activity: [
      { id: 'act_01', action: 'Proposal created', detail: 'Nike Air Max Experience draft started', date: '2026-03-28T00:00:00Z' },
      { id: 'act_02', action: 'Phase completed', detail: 'SNKRS Fest - Fabrication phase marked complete', date: '2026-03-20T00:00:00Z' },
      { id: 'act_03', action: 'Contact added', detail: 'Marcus Rivera added as operations contact', date: '2026-03-10T00:00:00Z' },
      { id: 'act_04', action: 'Proposal approved', detail: 'SNKRS Fest 2026 approved by client', date: '2026-01-18T00:00:00Z' },
      { id: 'act_05', action: 'Client created', detail: 'Nike added to organization', date: '2025-02-01T00:00:00Z' },
    ],
  },
};

const defaultClient = clientsData.client_001;

function formatStatus(status: string): string {
  return status
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function roleLabel(role: string): string {
  const map: Record<string, string> = {
    primary: 'Primary',
    billing: 'Billing',
    creative: 'Creative',
    operations: 'Operations',
  };
  return map[role] ?? role;
}

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = clientsData[id] ?? defaultClient;

  return (
    <>
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-text-muted">
        <Link href="/app/clients" className="hover:text-foreground transition-colors">
          Clients
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">{client.company_name}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {client.company_name}
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            {client.industry} &middot; Source: {client.source}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {client.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full bg-bg-secondary px-3 py-1 text-xs font-medium text-text-secondary"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-bg-secondary">
            Edit Client
          </button>
          <Link
            href="/app/proposals/new"
            className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-foreground/90"
          >
            New Proposal
          </Link>
        </div>
      </div>

      <div className="space-y-8">
        {/* Contacts */}
        <div className="rounded-xl border border-border bg-white overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Contacts</h2>
            <button className="text-xs font-medium text-text-muted hover:text-foreground transition-colors">
              + Add Contact
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-bg-secondary">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {client.contacts.map((contact) => (
                  <tr key={contact.id} className="transition-colors hover:bg-bg-secondary/50">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{contact.name}</span>
                        {contact.is_decision_maker && (
                          <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                            Decision Maker
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-sm text-text-secondary">{contact.title}</td>
                    <td className="px-6 py-3.5 text-sm text-text-secondary">{contact.email}</td>
                    <td className="px-6 py-3.5 text-sm text-text-secondary">{contact.phone}</td>
                    <td className="px-6 py-3.5">
                      <span className="inline-flex items-center rounded-full bg-bg-secondary px-2.5 py-0.5 text-xs font-medium text-text-secondary">
                        {roleLabel(contact.role)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Proposals */}
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-4">Proposals</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {client.proposals.map((proposal) => (
              <Link
                key={proposal.id}
                href={`/app/proposals/${proposal.id}`}
                className="block rounded-xl border border-border bg-white px-6 py-5 transition-colors hover:border-foreground/20"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {proposal.name}
                    </p>
                    <p className="mt-1 text-xs text-text-muted">
                      Prepared {formatDate(proposal.prepared_date)}
                    </p>
                  </div>
                  <span
                    className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor(proposal.status)}`}
                  >
                    {formatStatus(proposal.status)}
                  </span>
                </div>
                <p className="mt-3 text-lg font-semibold tabular-nums text-foreground">
                  {formatCurrency(proposal.total_value)}
                </p>
              </Link>
            ))}
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="rounded-xl border border-border bg-white px-6 py-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Activity</h2>
          <div className="space-y-0">
            {client.activity.map((event, index) => (
              <div key={event.id} className="relative flex gap-4 pb-6 last:pb-0">
                {/* Timeline connector */}
                {index < client.activity.length - 1 && (
                  <div className="absolute left-[7px] top-5 bottom-0 w-px bg-border" />
                )}
                <div className="relative mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-border bg-white" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{event.action}</p>
                  <p className="text-xs text-text-muted mt-0.5">{event.detail}</p>
                  <p className="text-xs text-text-muted mt-1">{formatDate(event.date)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
