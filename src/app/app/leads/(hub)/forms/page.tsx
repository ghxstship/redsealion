import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import EmptyState from '@/components/ui/EmptyState';
import LeadFormsHeader from '@/components/admin/leads/LeadFormsHeader';
import LeadsHubTabs from '../../LeadsHubTabs';
import PageHeader from '@/components/shared/PageHeader';

interface LeadForm {
  id: string;
  name: string;
  description: string | null;
  status: string;
  embed_url: string | null;
  submissions_count: number;
  created_at: string;
  last_submission_at: string | null;
}



const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-50 text-green-700',
  draft: 'bg-bg-secondary text-text-muted',
  archived: 'bg-red-50 text-red-700',
};

async function getLeadForms(): Promise<LeadForm[]> {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) throw new Error('No auth');
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('No auth');
const { data: forms } = await supabase
      .from('lead_forms')
      .select()
      .eq('organization_id', ctx.organizationId)
      .order('created_at', { ascending: false });

    if (!forms) throw new Error('No forms');

    return forms.map((f: Record<string, unknown>) => ({
      id: f.id as string,
      name: f.name as string,
      description: (f.description as string) ?? null,
      status: (f.status as string) ?? 'draft',
      embed_url: (f.embed_url as string) ?? null,
      submissions_count: (f.submissions_count as number) ?? 0,
      created_at: f.created_at as string,
      last_submission_at: (f.last_submission_at as string) ?? null,
    }));
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
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      STATUS_COLORS[form.status] ?? 'bg-bg-secondary text-text-muted'
                    }`}
                  >
                    {formatLabel(form.status)}
                  </span>
                </div>
                {form.description && (
                  <p className="mt-1 text-sm text-text-secondary">{form.description}</p>
                )}
                {form.embed_url && (
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-xs text-text-muted">Embed URL:</span>
                    <code className="rounded bg-bg-tertiary px-2 py-0.5 text-xs text-text-secondary">
                      {form.embed_url}
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
  );
}
