import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import StatusBadge, { LEAD_STATUS_COLORS } from '@/components/ui/StatusBadge';
import { scoreBarColor, scoreTierClasses } from '@/lib/leads/lead-scoring';
import PageHeader from '@/components/shared/PageHeader';
import LeadDetailActions from './LeadDetailActions';

interface LeadDetail {
  id: string;
  contact_first_name: string;
  contact_last_name: string;
  contact_email: string | null;
  contact_phone: string | null;
  company_name: string | null;
  source: string;
  status: string;
  estimated_budget: number | null;
  message: string | null;
  event_type: string | null;
  event_date: string | null;
  assigned_to: string | null;
  assigned_user_name: string | null;
  converted_to_deal_id: string | null;
  converted_to_client_id: string | null;
  lost_reason: string | null;
  score: number;
  score_tier: string;
  created_at: string;
  updated_at: string;
}

async function getLead(id: string): Promise<LeadDetail | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: membership } = await supabase
      .from('organization_memberships')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: true })
      .limit(1)
      .single();
    if (!membership) return null;

    const { data: lead } = await supabase
      .from('leads')
      .select('*, users!leads_assigned_to_fkey(id, full_name)')
      .eq('id', id)
      .eq('organization_id', membership.organization_id)
      .is('deleted_at', null)
      .single();

    if (!lead) return null;

    const assignedUser = (lead as Record<string, unknown>).users as Record<string, unknown> | null;

    return {
      id: lead.id,
      contact_first_name: lead.contact_first_name || '',
      contact_last_name: lead.contact_last_name || '',
      contact_email: lead.contact_email ?? null,
      contact_phone: lead.contact_phone ?? null,
      company_name: lead.company_name ?? null,
      source: lead.source ?? 'Unknown',
      status: lead.status ?? 'new',
      estimated_budget: lead.estimated_budget ?? null,
      message: lead.message ?? null,
      event_type: lead.event_type ?? null,
      event_date: lead.event_date ?? null,
      assigned_to: lead.assigned_to ?? null,
      assigned_user_name: (assignedUser?.full_name as string) ?? null,
      converted_to_deal_id: lead.converted_to_deal_id ?? null,
      converted_to_client_id: lead.converted_to_client_id ?? null,
      lost_reason: lead.lost_reason ?? null,
      score: (lead as Record<string, unknown>).score as number ?? 0,
      score_tier: (lead as Record<string, unknown>).score_tier as string ?? 'cold',
      created_at: lead.created_at,
      updated_at: lead.updated_at,
    };
  } catch {
    return null;
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lead = await getLead(id);

  if (!lead) notFound();

  const score = lead.score;
  const tier = (lead.score_tier ?? 'cold') as 'hot' | 'warm' | 'cold';
  const fullName = `${lead.contact_first_name} ${lead.contact_last_name}`.trim();

  return (
    <>
      <PageHeader
        title={fullName || 'Unnamed Lead'}
        subtitle={lead.company_name ?? 'Individual'}
      >
        <LeadDetailActions leadId={lead.id} status={lead.status} />
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Card */}
          <div className="rounded-xl border border-border bg-background p-6">
            <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">Contact Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-text-muted">Name</p>
                <p className="text-sm font-medium text-foreground">{fullName || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted">Email</p>
                <p className="text-sm text-foreground">{lead.contact_email || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted">Phone</p>
                <p className="text-sm text-foreground">{lead.contact_phone || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted">Company</p>
                <p className="text-sm text-foreground">{lead.company_name || '—'}</p>
              </div>
            </div>
          </div>

          {/* Event Card */}
          <div className="rounded-xl border border-border bg-background p-6">
            <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">Event Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-text-muted">Event Type</p>
                <p className="text-sm text-foreground">{lead.event_type || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted">Event Date</p>
                <p className="text-sm text-foreground">{lead.event_date ? formatDate(lead.event_date + 'T00:00:00') : '—'}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted">Estimated Budget</p>
                <p className="text-sm font-medium text-foreground">
                  {lead.estimated_budget != null ? formatCurrency(lead.estimated_budget) : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-muted">Source</p>
                <p className="text-sm text-foreground">{lead.source}</p>
              </div>
            </div>
          </div>

          {/* Notes */}
          {lead.message && (
            <div className="rounded-xl border border-border bg-background p-6">
              <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">Notes / Message</h2>
              <p className="text-sm text-text-secondary whitespace-pre-wrap">{lead.message}</p>
            </div>
          )}

          {/* Conversion Info */}
          {lead.status === 'converted' && (
            <div className="rounded-xl border border-green-200 bg-green-50/50 p-6">
              <h2 className="text-sm font-semibold text-green-700 uppercase tracking-wider mb-4">Converted</h2>
              <div className="flex flex-wrap gap-4">
                {lead.converted_to_deal_id && (
                  <Link
                    href={`/app/pipeline?deal=${lead.converted_to_deal_id}`}
                    className="text-sm text-green-700 underline hover:text-green-900"
                  >
                    View Deal →
                  </Link>
                )}
                {lead.converted_to_client_id && (
                  <Link
                    href={`/app/clients/${lead.converted_to_client_id}`}
                    className="text-sm text-green-700 underline hover:text-green-900"
                  >
                    View Client →
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Lost Reason */}
          {lead.status === 'lost' && lead.lost_reason && (
            <div className="rounded-xl border border-red-200 bg-red-50/50 p-6">
              <h2 className="text-sm font-semibold text-red-700 uppercase tracking-wider mb-4">Lost Reason</h2>
              <p className="text-sm text-red-700">{lead.lost_reason}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status & Score */}
          <div className="rounded-xl border border-border bg-background p-6 space-y-4">
            <div>
              <p className="text-xs text-text-muted mb-1">Status</p>
              <StatusBadge status={lead.status} colorMap={LEAD_STATUS_COLORS} />
            </div>
            <div>
              <p className="text-xs text-text-muted mb-1">Lead Score</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 rounded-full bg-bg-secondary overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${scoreBarColor(score)}`}
                    style={{ width: `${score}%` }}
                  />
                </div>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${scoreTierClasses(tier)}`}>
                  {score}
                </span>
              </div>
            </div>
            <div>
              <p className="text-xs text-text-muted mb-1">Assigned To</p>
              <p className="text-sm text-foreground">{lead.assigned_user_name || 'Unassigned'}</p>
            </div>
          </div>

          {/* Timestamps */}
          <div className="rounded-xl border border-border bg-background p-6 space-y-3">
            <div>
              <p className="text-xs text-text-muted">Created</p>
              <p className="text-sm text-text-secondary">{formatDate(lead.created_at)}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted">Last Updated</p>
              <p className="text-sm text-text-secondary">{formatDate(lead.updated_at)}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
