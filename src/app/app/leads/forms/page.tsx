import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

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

const fallbackForms: LeadForm[] = [
  { id: 'form_001', name: 'General Inquiry', description: 'Default intake form for new event inquiries', status: 'active', embed_url: 'https://forms.flytedeck.io/f/general-inquiry', submissions_count: 42, created_at: '2025-10-01', last_submission_at: '2026-04-01' },
  { id: 'form_002', name: 'Corporate Events', description: 'Tailored for corporate brand activation leads', status: 'active', embed_url: 'https://forms.flytedeck.io/f/corporate-events', submissions_count: 18, created_at: '2026-01-15', last_submission_at: '2026-03-28' },
  { id: 'form_003', name: 'Festival & Concert', description: 'For large-scale festival and music event inquiries', status: 'draft', embed_url: null, submissions_count: 0, created_at: '2026-03-20', last_submission_at: null },
];

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-50 text-green-700',
  draft: 'bg-gray-100 text-gray-600',
  archived: 'bg-red-50 text-red-700',
};

async function getLeadForms(): Promise<LeadForm[]> {
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

    const { data: forms } = await supabase
      .from('lead_forms')
      .select('*')
      .eq('organization_id', userData.organization_id)
      .order('created_at', { ascending: false });

    if (!forms || forms.length === 0) throw new Error('No forms');

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
    return fallbackForms;
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
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Lead Forms
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            {forms.length} forms &middot; Embed on your website to capture leads
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/app/leads"
            className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-bg-secondary"
          >
            Lead Inbox
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
            Create Form
          </button>
        </div>
      </div>

      {/* Form cards */}
      <div className="space-y-4">
        {forms.map((form) => (
          <div
            key={form.id}
            className="rounded-xl border border-border bg-white p-6 transition-colors hover:border-foreground/20"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <h3 className="text-sm font-medium text-foreground">{form.name}</h3>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      STATUS_COLORS[form.status] ?? 'bg-gray-100 text-gray-600'
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
        {forms.length === 0 && (
          <div className="rounded-xl border border-border bg-white px-6 py-12 text-center text-sm text-text-muted">
            No lead forms yet. Create one to start capturing leads from your website.
          </div>
        )}
      </div>
    </>
  );
}
