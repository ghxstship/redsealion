import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

interface Lead {
  id: string;
  name: string;
  email: string;
  company: string | null;
  phone: string | null;
  status: string;
  source: string;
  estimated_budget: number | null;
  created_at: string;
}

const fallbackLeads: Lead[] = [
  { id: 'lead_001', name: 'Rachel Kim', email: 'rachel.kim@adidas.com', company: 'Adidas', phone: '+1 503 555 0301', status: 'new', source: 'Website', estimated_budget: 200000, created_at: '2026-03-30' },
  { id: 'lead_002', name: 'Derek Washington', email: 'derek.w@redbull.com', company: 'Red Bull', phone: '+1 310 555 0402', status: 'contacted', source: 'Referral', estimated_budget: 350000, created_at: '2026-03-28' },
  { id: 'lead_003', name: 'Priya Sharma', email: 'priya@meta.com', company: 'Meta', phone: null, status: 'qualified', source: 'LinkedIn', estimated_budget: 500000, created_at: '2026-03-25' },
  { id: 'lead_004', name: 'Tom Andersen', email: 'tom.a@spotify.com', company: 'Spotify', phone: '+1 212 555 0503', status: 'new', source: 'Lead Form', estimated_budget: 150000, created_at: '2026-04-01' },
  { id: 'lead_005', name: 'Lisa Park', email: 'lisa.park@google.com', company: 'Google', phone: '+1 650 555 0604', status: 'contacted', source: 'Website', estimated_budget: 450000, created_at: '2026-03-22' },
  { id: 'lead_006', name: 'James Butler', email: 'jbutler@amazon.com', company: 'Amazon', phone: null, status: 'new', source: 'Cold Outreach', estimated_budget: null, created_at: '2026-04-02' },
];

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-50 text-blue-700',
  contacted: 'bg-yellow-50 text-yellow-700',
  qualified: 'bg-green-50 text-green-700',
  proposal_sent: 'bg-purple-50 text-purple-700',
  won: 'bg-green-100 text-green-800',
  lost: 'bg-red-50 text-red-700',
  archived: 'bg-gray-100 text-gray-600',
  disqualified: 'bg-red-50 text-red-700',
};

async function getLeads(): Promise<Lead[]> {
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

    const { data: leads } = await supabase
      .from('leads')
      .select()
      .eq('organization_id', userData.organization_id)
      .order('created_at', { ascending: false });

    if (!leads || leads.length === 0) throw new Error('No leads');

    return leads.map((l: Record<string, unknown>) => ({
      id: l.id as string,
      name: l.name as string,
      email: l.email as string,
      company: (l.company as string) ?? null,
      phone: (l.phone as string) ?? null,
      status: (l.status as string) ?? 'new',
      source: (l.source as string) ?? 'Unknown',
      estimated_budget: (l.estimated_budget as number) ?? null,
      created_at: l.created_at as string,
    }));
  } catch {
    return fallbackLeads;
  }
}

function formatLabel(s: string): string {
  return s
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default async function LeadsPage() {
  const leads = await getLeads();

  const statusTabs = ['all', 'new', 'contacted', 'qualified'] as const;

  return (
    <>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Leads
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            {leads.length} leads in your inbox
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/app/leads/forms"
            className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-bg-secondary"
          >
            Lead Forms
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
            Create Lead Form
          </button>
        </div>
      </div>

      {/* Status tabs */}
      <div className="mb-6 flex gap-1 rounded-lg border border-border bg-bg-secondary p-1 w-fit">
        {statusTabs.map((tab) => (
          <div
            key={tab}
            className="rounded-md bg-white px-4 py-1.5 text-sm font-medium text-foreground shadow-sm first:bg-white [&:not(:first-child)]:bg-transparent [&:not(:first-child)]:text-text-muted [&:not(:first-child)]:shadow-none cursor-pointer hover:text-foreground transition-colors"
          >
            {formatLabel(tab)} ({tab === 'all' ? leads.length : leads.filter((l) => l.status === tab).length})
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-white overflow-hidden overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-bg-secondary">
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Company</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Contact</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Source</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Budget</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {leads.map((lead) => (
              <tr key={lead.id} className="transition-colors hover:bg-bg-secondary/50">
                <td className="px-6 py-3.5 text-sm font-medium text-foreground">
                  {lead.name}
                </td>
                <td className="px-6 py-3.5 text-sm text-text-secondary">
                  {lead.company ?? '\u2014'}
                </td>
                <td className="px-6 py-3.5">
                  <div className="text-sm text-text-secondary">{lead.email}</div>
                  {lead.phone && (
                    <div className="text-xs text-text-muted">{lead.phone}</div>
                  )}
                </td>
                <td className="px-6 py-3.5">
                  <span className="inline-flex items-center rounded-full bg-bg-secondary px-2.5 py-0.5 text-xs font-medium text-text-secondary">
                    {lead.source}
                  </span>
                </td>
                <td className="px-6 py-3.5 text-sm tabular-nums text-foreground">
                  {lead.estimated_budget != null
                    ? formatCurrency(lead.estimated_budget)
                    : '\u2014'}
                </td>
                <td className="px-6 py-3.5">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      STATUS_COLORS[lead.status] ?? 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {formatLabel(lead.status)}
                  </span>
                </td>
                <td className="px-6 py-3.5 text-sm text-text-muted">
                  {formatDate(lead.created_at)}
                </td>
              </tr>
            ))}
            {leads.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-sm text-text-muted">
                  No leads yet. Share your lead form to start capturing interest.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
