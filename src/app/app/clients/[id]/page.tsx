import Link from 'next/link';
import { formatCurrency, statusColor } from '@/lib/utils';
import { createClient } from '@/lib/supabase/server';
import ClientInteractions from '@/components/admin/clients/ClientInteractions';

interface ClientDetail {
  company_name: string;
  industry: string | null;
  tags: string[];
  billing_address: string;
  source: string | null;
  website: string | null;
  linkedin: string | null;
  annual_revenue: number | null;
  employee_count: number | null;
  notes: string | null;
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
  deals: Array<{
    id: string;
    title: string;
    value: number;
    stage: string;
  }>;
  interactions: Array<{
    id: string;
    type: string;
    subject: string;
    body: string | null;
    occurred_at: string;
  }>;
  activity: Array<{
    id: string;
    action: string;
    detail: string;
    date: string;
  }>;
}

const fallbackClients: Record<string, ClientDetail> = {
  client_001: {
    company_name: 'Nike',
    industry: 'Sportswear & Apparel',
    tags: ['enterprise', 'repeat'],
    billing_address: 'One Bowerman Drive, Beaverton, OR 97005',
    source: 'Referral',
    website: 'https://www.nike.com',
    linkedin: 'https://www.linkedin.com/company/nike',
    annual_revenue: 51200000000,
    employee_count: 79400,
    notes: 'Key account. Strong relationship with brand experience team.',
    contacts: [
      { id: 'cc_001', name: 'Sarah Chen', title: 'VP Brand Experience', email: 'sarah.chen@nike.com', phone: '+1 503 555 0101', role: 'primary', is_decision_maker: true },
      { id: 'cc_002', name: 'Marcus Rivera', title: 'Senior Event Manager', email: 'marcus.r@nike.com', phone: '+1 503 555 0102', role: 'operations', is_decision_maker: false },
      { id: 'cc_003', name: 'Aiko Tanaka', title: 'Finance Director', email: 'aiko.tanaka@nike.com', phone: '+1 503 555 0103', role: 'billing', is_decision_maker: false },
    ],
    proposals: [
      { id: 'prop_001', name: 'Nike Air Max Experience', status: 'draft', total_value: 185000, prepared_date: '2026-03-28T00:00:00Z' },
      { id: 'prop_005', name: 'Nike SNKRS Fest 2026', status: 'in_production', total_value: 425000, prepared_date: '2026-01-15T00:00:00Z' },
    ],
    deals: [
      { id: 'deal_001', title: 'Nike Air Max Experience', value: 185000, stage: 'lead' },
      { id: 'deal_005', title: 'Nike SNKRS Fest 2026', value: 425000, stage: 'contract_signed' },
    ],
    interactions: [
      { id: 'int_01', type: 'meeting', subject: 'Quarterly review with brand team', body: 'Discussed 2026 roadmap and upcoming activations.', occurred_at: '2026-03-25T14:00:00Z' },
      { id: 'int_02', type: 'call', subject: 'Air Max Experience scope call', body: 'Reviewed scope requirements and timeline for Air Max Day activation.', occurred_at: '2026-03-20T10:00:00Z' },
      { id: 'int_03', type: 'email', subject: 'SNKRS Fest production update', body: null, occurred_at: '2026-03-18T09:00:00Z' },
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

const defaultClient = fallbackClients.client_001;

async function getClient(id: string): Promise<ClientDetail> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error('No auth');

    const { data: client } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single();

    if (!client) throw new Error('Not found');

    const { data: contacts } = await supabase
      .from('client_contacts')
      .select('*')
      .eq('client_id', id);

    const { data: proposals } = await supabase
      .from('proposals')
      .select('id, name, status, total_value, prepared_date')
      .eq('client_id', id);

    const { data: deals } = await supabase
      .from('deals')
      .select('id, title, value, stage')
      .eq('client_id', id);

    const { data: interactions } = await supabase
      .from('client_interactions')
      .select('id, type, subject, body, occurred_at')
      .eq('client_id', id)
      .order('occurred_at', { ascending: false });

    const addr = client.billing_address as Record<string, string> | null;
    const addrStr = addr
      ? [addr.street, addr.city, addr.state, addr.zip].filter(Boolean).join(', ')
      : '';

    return {
      company_name: client.company_name,
      industry: client.industry,
      tags: client.tags ?? [],
      billing_address: addrStr,
      source: client.source,
      website: client.website ?? null,
      linkedin: client.linkedin ?? null,
      annual_revenue: client.annual_revenue ?? null,
      employee_count: client.employee_count ?? null,
      notes: client.notes ?? null,
      contacts: (contacts ?? []).map((c: Record<string, unknown>) => ({
        id: c.id as string,
        name: `${c.first_name} ${c.last_name}`,
        title: (c.title as string) ?? '',
        email: c.email as string,
        phone: (c.phone as string) ?? '',
        role: c.role as string,
        is_decision_maker: c.is_decision_maker as boolean,
      })),
      proposals: (proposals ?? []).map((p: Record<string, unknown>) => ({
        id: p.id as string,
        name: p.name as string,
        status: p.status as string,
        total_value: p.total_value as number,
        prepared_date: p.prepared_date as string,
      })),
      deals: (deals ?? []).map((d: Record<string, unknown>) => ({
        id: d.id as string,
        title: d.title as string,
        value: d.value as number,
        stage: d.stage as string,
      })),
      interactions: (interactions ?? []).map((i: Record<string, unknown>) => ({
        id: i.id as string,
        type: i.type as string,
        subject: i.subject as string,
        body: (i.body as string) ?? null,
        occurred_at: i.occurred_at as string,
      })),
      activity: [],
    };
  } catch {
    return fallbackClients[id] ?? defaultClient;
  }
}

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
  const client = await getClient(id);

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
            {client.industry} &middot; Source: {client.source ?? 'Unknown'}
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
        {/* CRM Info */}
        {(client.website || client.annual_revenue || client.employee_count) && (
          <div className="rounded-xl border border-border bg-white p-6">
            <h2 className="text-sm font-semibold text-foreground mb-4">Company Info</h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {client.website && (
                <div>
                  <p className="text-xs text-text-muted">Website</p>
                  <a href={client.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline truncate block">{client.website}</a>
                </div>
              )}
              {client.linkedin && (
                <div>
                  <p className="text-xs text-text-muted">LinkedIn</p>
                  <a href={client.linkedin} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline truncate block">Profile</a>
                </div>
              )}
              {client.annual_revenue != null && (
                <div>
                  <p className="text-xs text-text-muted">Annual Revenue</p>
                  <p className="text-sm font-medium text-foreground">{formatCurrency(client.annual_revenue)}</p>
                </div>
              )}
              {client.employee_count != null && (
                <div>
                  <p className="text-xs text-text-muted">Employees</p>
                  <p className="text-sm font-medium text-foreground">{client.employee_count.toLocaleString()}</p>
                </div>
              )}
            </div>
            {client.notes && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs text-text-muted mb-1">Notes</p>
                <p className="text-sm text-text-secondary">{client.notes}</p>
              </div>
            )}
          </div>
        )}

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

        {/* Deals */}
        {client.deals.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-foreground mb-4">Deals</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {client.deals.map((deal) => (
                <Link
                  key={deal.id}
                  href={`/app/pipeline/${deal.id}`}
                  className="block rounded-xl border border-border bg-white px-6 py-5 transition-colors hover:border-foreground/20"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium text-foreground truncate">
                      {deal.title}
                    </p>
                    <span
                      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor(deal.stage)}`}
                    >
                      {formatStatus(deal.stage)}
                    </span>
                  </div>
                  <p className="mt-2 text-lg font-semibold tabular-nums text-foreground">
                    {formatCurrency(deal.value)}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Interactions */}
        <ClientInteractions interactions={client.interactions} />

        {/* Activity Timeline */}
        {client.activity.length > 0 && (
          <div className="rounded-xl border border-border bg-white px-6 py-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">Activity</h2>
            <div className="space-y-0">
              {client.activity.map((event, index) => (
                <div key={event.id} className="relative flex gap-4 pb-6 last:pb-0">
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
        )}
      </div>
    </>
  );
}
