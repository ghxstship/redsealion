import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import TemplatesHeader from '@/components/admin/templates/TemplatesHeader';
import TemplateActions from '@/components/admin/templates/TemplateActions';
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge, { GENERIC_STATUS_COLORS } from '@/components/ui/StatusBadge';
import { formatDate } from '@/lib/utils';

interface TemplateRow {
  id: string;
  name: string;
  description: string | null;
  is_default: boolean;
  phases: string[];
  updated_at: string;
}



async function getTemplates(): Promise<TemplateRow[]> {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) throw new Error('No auth');
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error('No auth');
const { data: templates } = await supabase
      .from('phase_templates')
      .select('*')
      .eq('organization_id', ctx.organizationId)
      .order('is_default', { ascending: false });

    if (!templates) return [];

    return templates.map((t: { id: string; name: string; description: string | null; is_default: boolean; phases: string[]; updated_at: string }) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      is_default: t.is_default,
      phases: t.phases,
      updated_at: t.updated_at,
    }));
  } catch {
    return [];
  }
}

export default async function TemplatesPage() {
  const templates = await getTemplates();

  return (
    <>
<PageHeader
        title="Phase Templates"
        subtitle="Define reusable phase structures for your proposals."
      >
        <TemplatesHeader />
      </PageHeader>

      {/* Templates list */}
      <div className="space-y-4">
        {templates.map((template) => (
          <div
            key={template.id}
            className={`rounded-xl border bg-background px-6 py-5 transition-colors hover:border-foreground/20 ${
              template.is_default ? 'border-foreground/30' : 'border-border'
            }`}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2.5">
                  <h3 className="text-sm font-semibold text-foreground">
                    {template.name}
                  </h3>
                  {template.is_default && (
                    <StatusBadge status="active" colorMap={{ active: 'bg-green-50 text-green-700' }} />
                  )}
                </div>
                <p className="mt-1.5 text-sm text-text-secondary leading-relaxed">
                  {template.description}
                </p>
              </div>
              <div className="shrink-0 flex flex-col items-end gap-2">
                <p className="text-xs text-text-muted">
                  Updated {formatDate(template.updated_at)}
                </p>
                <TemplateActions templateId={template.id} />
              </div>
            </div>

            {/* Phases preview */}
            <div className="mt-4 flex flex-wrap gap-2">
              {template.phases.map((phase, idx) => (
                <span
                  key={`${phase}-${idx}`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-bg-secondary px-3 py-1 text-xs font-medium text-text-secondary"
                >
                  <span className="text-text-muted font-mono">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  {phase}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

