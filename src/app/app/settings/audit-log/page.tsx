import { createClient } from '@/lib/supabase/server';
import { TierGate } from '@/components/shared/TierGate';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import EmptyState from '@/components/ui/EmptyState';
import PageHeader from '@/components/shared/PageHeader';

interface AuditEntry {
  id: string;
  userId: string | null;
  userName: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  ipAddress: string | null;
  createdAt: string;
}

async function getAuditLog(): Promise<AuditEntry[]> {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) throw new Error('No auth');

    const { data } = await supabase
      .from('audit_log')
      .select('id, user_id, action, entity_type, entity_id, ip_address, created_at')
      .eq('organization_id', ctx.organizationId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (!data || data.length === 0) return [];

    const userIds = [...new Set(data.map((e) => e.user_id).filter(Boolean))] as string[];
    const { data: users } = userIds.length > 0
      ? await supabase.from('users').select('id, full_name').in('id', userIds)
      : { data: [] };
    const nameMap = new Map((users ?? []).map((u) => [u.id, u.full_name]));

    return data.map((e) => ({
      id: e.id,
      userId: e.user_id,
      userName: e.user_id ? (nameMap.get(e.user_id) ?? null) : null,
      action: e.action,
      entityType: e.entity_type,
      entityId: e.entity_id,
      ipAddress: e.ip_address,
      createdAt: e.created_at,
    }));
  } catch {
    return [];
  }
}

function actionColor(action: string): string {
  const map: Record<string, string> = {
    create: 'bg-green-50 text-green-700',
    update: 'bg-blue-50 text-blue-700',
    delete: 'bg-red-500/10 text-red-700',
    approve: 'bg-emerald-50 text-emerald-700',
    reject: 'bg-orange-50 text-orange-700',
    login: 'bg-indigo-50 text-indigo-700',
    export: 'bg-purple-50 text-purple-700',
    invite: 'bg-cyan-50 text-cyan-700',
    configure: 'bg-bg-secondary text-text-secondary',
  };
  return map[action] ?? 'bg-bg-secondary text-text-muted';
}

export default async function AuditLogPage() {
  const entries = await getAuditLog();

  return (
    <TierGate feature="audit_log">
<PageHeader
        title="Audit Log"
        subtitle="Security and compliance event log for your organization."
      />

      {entries.length === 0 ? (
        <EmptyState message="No audit logs recorded yet" />
      ) : (
        <div className="rounded-xl border border-border bg-background overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-bg-secondary">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Timestamp</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Action</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Entity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {entries.map((entry) => (
                  <tr key={entry.id} className="transition-colors hover:bg-bg-secondary/50">
                    <td className="px-6 py-3.5 text-sm tabular-nums text-text-secondary">
                      {new Date(entry.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-3.5 text-sm text-foreground">
                      {entry.userName ?? 'System'}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${actionColor(entry.action)}`}>
                        {entry.action}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-sm text-text-secondary">
                      <span className="capitalize">{entry.entityType.replace(/_/g, ' ')}</span>
                      {entry.entityId && (
                        <span className="ml-1 text-text-muted font-mono text-xs">
                          {entry.entityId.slice(0, 8)}…
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-sm font-mono text-text-muted">
                      {entry.ipAddress ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </TierGate>
  );
}
