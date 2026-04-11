import Link from 'next/link';
import { TierGate } from '@/components/shared/TierGate';
import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import EmptyState from '@/components/ui/EmptyState';
import { formatLabel } from '@/lib/utils';
import StatusBadge, { GENERIC_STATUS_COLORS } from '@/components/ui/StatusBadge';

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



async function getAutomations(): Promise<AutomationRow[]> {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return [];

    const { data: automations } = await supabase
      .from('automations')
      .select()
      .eq('organization_id', ctx.organizationId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (!automations) return [];

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
    return [];
  }
}

export default async function AutomationsPage() {
  const automations = await getAutomations();

  return (
    <TierGate feature="automations">
      <div className="rounded-xl border border-border bg-background divide-y divide-border">
        {automations.map((automation) => (
          <div key={automation.id} className="px-5 py-4 flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-foreground truncate">
                  {automation.name}
                </h3>
                <span
                  className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
                    automation.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-bg-secondary text-text-muted'
                  }`}
                >
                  {automation.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-text-secondary">{automation.description || 'No description'}</p>
              <div className="mt-1 flex items-center gap-4 text-xs text-text-muted">
                <span>Trigger: {formatLabel(automation.trigger_type)}</span>
                <span>Action: {formatLabel(automation.action_type)}</span>
                <span>Runs: {automation.run_count}</span>
                {automation.last_run_at && (
                  <span>Last run: {new Date(automation.last_run_at).toLocaleDateString()}</span>
                )}
              </div>
            </div>
            <Link
              href={`/app/automations/${automation.id}`}
              className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-bg-secondary transition-colors"
            >
              Edit
            </Link>
          </div>
        ))}
      </div>

      {automations.length === 0 && (
        <EmptyState
          message="No automations configured yet"
          action={
            <Link
              href="/app/automations/new"
              className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
            >
              Create your first automation
            </Link>
          }
        />
      )}
    </TierGate>
  );
}
