import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge, { GENERIC_STATUS_COLORS } from '@/components/ui/StatusBadge';
import Link from 'next/link';
import MetricCard from '@/components/ui/MetricCard';

interface SyncError {
  id: string;
  platform: string;
  entity_type: string;
  error_message: string;
  occurred_at: string;
  resolved: boolean;
}

async function getSyncErrors(): Promise<SyncError[]> {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return [];

    // Try integration_sync_log table first
    const { data, error } = await supabase
      .from('integration_sync_log')
      .select('id, platform, entity_type, error_message, created_at, resolved')
      .eq('organization_id', ctx.organizationId)
      .eq('status', 'error')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      // Table may not exist — return empty gracefully
      return [];
    }

    return (data ?? []).map((row: Record<string, unknown>) => ({
      id: row.id as string,
      platform: row.platform as string,
      entity_type: (row.entity_type as string) ?? 'unknown',
      error_message: (row.error_message as string) ?? 'Unknown error',
      occurred_at: (row.created_at as string),
      resolved: (row.resolved as boolean) ?? false,
    }));
  } catch {
    return [];
  }
}

export default async function SyncErrorsPage() {
  const errors = await getSyncErrors();
  const unresolved = errors.filter((e) => !e.resolved);

  return (
    <TierGate feature="integrations">
      <div className="mb-4">
        <Link href="/app/integrations" className="text-sm text-text-muted hover:text-foreground mb-2 inline-block">
          &larr; Back to Integrations
        </Link>
        <PageHeader
          title="Sync Errors"
          subtitle={`${unresolved.length} unresolved sync errors`}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 mb-8">
        <MetricCard label={"Total Errors"} value={errors.length} />
        <MetricCard label={"Unresolved"} value={unresolved.length} className="[&_.text-foreground]:text-red-600" />
        <MetricCard label={"Platforms Affected"} value={new Set(unresolved.map((e) => e.platform)).size} />
      </div>

      <div className="rounded-xl border border-border bg-background overflow-hidden">
        {errors.length === 0 ? (
          <div className="px-8 py-16 text-center">
            <p className="text-sm text-text-secondary">No sync errors. All integrations are syncing successfully.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-bg-secondary text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Platform</th>
                  <th className="px-4 py-3">Entity</th>
                  <th className="px-4 py-3">Error</th>
                  <th className="px-4 py-3">When</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {errors.map((err) => (
                  <tr key={err.id} className="hover:bg-bg-secondary/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground capitalize">{err.platform}</td>
                    <td className="px-4 py-3 text-text-secondary capitalize">{err.entity_type.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-3 text-text-secondary max-w-[300px] truncate">{err.error_message}</td>
                    <td className="px-4 py-3 text-text-muted text-xs whitespace-nowrap">{new Date(err.occurred_at).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        status={err.resolved ? 'resolved' : 'unresolved'}
                        colorMap={{ resolved: 'bg-green-50 text-green-700', unresolved: 'bg-red-50 text-red-700' }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </TierGate>
  );
}
