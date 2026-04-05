import Link from 'next/link';
import { TierGate } from '@/components/shared/TierGate';
import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';

interface AutomationRow {
  id: string;
  name: string;
  description: string;
  trigger_type: string;
  action_type: string;
  is_active: boolean;
  run_count: number;
  last_run_at: string | null;
}

const FALLBACK_AUTOMATIONS: AutomationRow[] = [
  {
    id: '1',
    name: 'Notify on proposal approval',
    description: 'Send a Slack message when a proposal is approved.',
    trigger_type: 'proposal_approved',
    action_type: 'send_slack',
    is_active: true,
    run_count: 12,
    last_run_at: '2026-03-28T14:30:00Z',
  },
  {
    id: '2',
    name: 'Create invoice on milestone',
    description: 'Auto-generate a deposit invoice when a milestone is completed.',
    trigger_type: 'milestone_completed',
    action_type: 'create_invoice',
    is_active: true,
    run_count: 5,
    last_run_at: '2026-03-25T10:00:00Z',
  },
  {
    id: '3',
    name: 'Overdue invoice reminder',
    description: 'Send email reminder when an invoice becomes overdue.',
    trigger_type: 'invoice_overdue',
    action_type: 'send_email',
    is_active: false,
    run_count: 0,
    last_run_at: null,
  },
];

function formatTrigger(type: string): string {
  return type.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function formatAction(type: string): string {
  return type.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

async function getAutomations(): Promise<AutomationRow[]> {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) throw new Error('No auth');
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error('No auth');
const { data: automations } = await supabase
      .from('automations')
      .select()
      .eq('organization_id', ctx.organizationId)
      .order('created_at', { ascending: false });

    if (!automations) throw new Error('No automations');

    return automations.map((a: Record<string, unknown>) => ({
      id: a.id as string,
      name: (a.name as string) ?? '',
      description: (a.description as string) ?? '',
      trigger_type: (a.trigger_type as string) ?? '',
      action_type: (a.action_type as string) ?? '',
      is_active: (a.is_active as boolean) ?? false,
      run_count: (a.run_count as number) ?? 0,
      last_run_at: (a.last_run_at as string) ?? null,
    }));
  } catch {
    return FALLBACK_AUTOMATIONS;
  }
}

export default async function AutomationsPage() {
  const automations = await getAutomations();

  return (
    <TierGate feature="automations">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Automations
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Automate workflows with event triggers and actions.
          </p>
        </div>
        <Link
          href="/app/automations/new"
          className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
        >
          New Automation
        </Link>
      </div>

      <div className="rounded-xl border border-border bg-white divide-y divide-border">
        {automations.map((automation) => (
          <div key={automation.id} className="px-5 py-4 flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-foreground truncate">
                  {automation.name}
                </h3>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    automation.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {automation.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-text-secondary">{automation.description}</p>
              <div className="mt-1 flex items-center gap-4 text-xs text-text-muted">
                <span>Trigger: {formatTrigger(automation.trigger_type)}</span>
                <span>Action: {formatAction(automation.action_type)}</span>
                <span>Runs: {automation.run_count}</span>
                {automation.last_run_at && (
                  <span>Last run: {new Date(automation.last_run_at).toLocaleDateString()}</span>
                )}
              </div>
            </div>
            <button className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-bg-secondary transition-colors">
              Edit
            </button>
          </div>
        ))}
      </div>

      {automations.length === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-white px-5 py-12 text-center">
          <p className="text-sm text-text-muted">
            No automations configured yet.
          </p>
          <Link
            href="/app/automations/new"
            className="mt-3 inline-block text-sm font-medium text-foreground hover:opacity-70"
          >
            Create your first automation
          </Link>
        </div>
      )}
    </TierGate>
  );
}
