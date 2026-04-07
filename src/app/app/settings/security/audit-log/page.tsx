import { createClient } from '@/lib/supabase/server';
import { TierGate } from '@/components/shared/TierGate';
import AuditLogTable from '@/components/admin/security/AuditLogTable';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import PageHeader from '@/components/shared/PageHeader';

interface AuditRow {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  userName: string | null;
  createdAt: string;
}

async function getAuditLog(): Promise<AuditRow[]> {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) throw new Error('No auth');

    const { data } = await supabase
      .from('audit_log')
      .select('id, action, entity_type, entity_id, user_id, created_at')
      .eq('organization_id', ctx.organizationId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!data || data.length === 0) return [];

    const userIds = [...new Set(data.map((r) => r.user_id).filter(Boolean))] as string[];
    const { data: users } = userIds.length > 0
      ? await supabase.from('users').select('id, full_name').in('id', userIds)
      : { data: [] };

    const nameMap = new Map((users ?? []).map((u) => [u.id, u.full_name]));

    return data.map((r) => ({
      id: r.id,
      action: r.action,
      entityType: r.entity_type,
      entityId: r.entity_id,
      userName: r.user_id ? (nameMap.get(r.user_id) ?? null) : null,
      createdAt: r.created_at,
    }));
  } catch {
    return [];
  }
}

export default async function AuditLogPage() {
  const entries = await getAuditLog();

  return (
    <TierGate feature="audit_log">
<PageHeader
        title="Audit Log"
        subtitle="Complete history of actions taken in your organization."
      />

      <AuditLogTable entries={entries} />
    </TierGate>
  );
}
