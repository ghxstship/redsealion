import { createClient } from '@/lib/supabase/server';
import { TierGate } from '@/components/shared/TierGate';
import AuditLogTable from '@/components/admin/security/AuditLogTable';

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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();
    if (!userData) return [];

    const { data } = await supabase
      .from('audit_log')
      .select('id, action, entity_type, entity_id, user_id, created_at')
      .eq('organization_id', userData.organization_id)
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
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Audit Log
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Complete history of actions taken in your organization.
        </p>
      </div>

      <AuditLogTable entries={entries} />
    </TierGate>
  );
}
