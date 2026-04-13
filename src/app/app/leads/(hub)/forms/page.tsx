import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import EmptyState from '@/components/ui/EmptyState';
import StatusBadge, { GENERIC_STATUS_COLORS } from '@/components/ui/StatusBadge';
import LeadFormsHeader from '@/components/admin/leads/LeadFormsHeader';
import LeadsHubTabs from '../../LeadsHubTabs';
import PageHeader from '@/components/shared/PageHeader';

import { RoleGate } from '@/components/shared/RoleGate';
interface LeadForm {
  id: string;
  name: string;
  description: string | null;
  status: string;
  is_active: boolean;
  embed_token: string;
  redirect_url: string | null;
  submissions_count: number;
  created_at: string;
  last_submission_at: string | null;
}



async function getLeadForms(): Promise<LeadForm[]> {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) throw new Error('No auth');
    const { data: forms } = await supabase
      .from('lead_forms')
      .select()
      .eq('organization_id', ctx.organizationId)
      .order('created_at', { ascending: false });

    if (!forms) throw new Error('No forms');

    // Fetch submission counts per form
    const formIds = forms.map((f: Record<string, unknown>) => f.id as string);
    const submissionCounts: Record<string, { count: number; last: string | null }> = {};
    if (formIds.length > 0) {
      const { data: submissions } = await supabase
        .from('lead_form_submissions')
        .select('form_id, submitted_at')
        .in('form_id', formIds)
        .order('submitted_at', { ascending: false });

      if (submissions) {
        for (const s of submissions as Array<{ form_id: string; submitted_at: string }>) {
          if (!submissionCounts[s.form_id]) {
            submissionCounts[s.form_id] = { count: 0, last: s.submitted_at };
          }
          submissionCounts[s.form_id].count++;
        }
      }
    }

    return forms.map((f: Record<string, unknown>) => {
      const fid = f.id as string;
      return {
        id: fid,
        name: f.name as string,
        description: (f.description as string) ?? null,
        status: (f.status as string) ?? (f.is_active ? 'active' : 'draft'),
        is_active: (f.is_active as boolean) ?? true,
        embed_token: (f.embed_token as string) ?? '',
        redirect_url: (f.redirect_url as string) ?? null,
        submissions_count: submissionCounts[fid]?.count ?? 0,
        created_at: f.created_at as string,
        last_submission_at: submissionCounts[fid]?.last ?? null,
      };
    });
  } catch {
    return [];
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatLabel(s: string): string {
  return s
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export default async function LeadFormsPage() {
  const forms = await getLeadForms();

  return (
    <RoleGate>
    <>
      <PageHeader

        title="Forms"

        subtitle={`${forms.length} forms · Embed on your website to capture leads`}

      >

        <LeadFormsHeader />

      </PageHeader>

      <LeadsHubTabs />

      {/* Form cards */}
      <div className="space-y-4">
        {forms.map((form) => (
          <div
            key={form.id}
            className="rounded-xl border border-border bg-background p-6 transition-colors hover:border-foreground/20"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <h3 className="text-sm font-medium text-foreground">{form.name}</h3>
                  <StatusBadge status={form.status} colorMap={GENERIC_STATUS_COLORS} />
                </div>
                {form.description && (
                  <p className="mt-1 text-sm text-text-secondary">{form.description}</p>
                )}
                {form.embed_token && (
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-xs text-text-muted">Embed Token:</span>
                    <code className="rounded bg-bg-tertiary px-2 py-0.5 text-xs text-text-secondary">
                      {form.embed_token}
                    </code>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-6 shrink-0">
                <div className="text-right">
                  <p className="text-lg font-semibold tabular-nums text-foreground">
                    {form.submissions_count}
                  </p>
                  <p className="text-xs text-text-muted">submissions</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-text-secondary">
                    {form.last_submission_at
                      ? formatDate(form.last_submission_at)
                      : 'No submissions'}
                  </p>
                  <p className="text-xs text-text-muted">last received</p>
                </div>
              </div>
            </div>
          </div>
        ))}
        {forms.length === 0 ? (
          <EmptyState
            message="No active lead forms"
            description="Create public forms to embed on your website and capture leads."
          />
        ) : null}
      </div>
    </>
  </RoleGate>
  );
}
