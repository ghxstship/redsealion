import { TierGate } from '@/components/shared/TierGate';
import PermissionMatrix from '@/components/admin/security/PermissionMatrix';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { createClient } from '@/lib/supabase/server';
import PageHeader from '@/components/shared/PageHeader';

async function getPermissionData() {
  try {
    const ctx = await resolveCurrentOrg();
    if (!ctx) return { organizationId: '', overrides: [] };

    const supabase = await createClient();
    const { data: rolePermissions } = await supabase
      .from('role_permissions')
      .select('roles(name), permission_catalog(resource, action), granted');

    const overrides = (rolePermissions ?? []).map((rp: Record<string, unknown>) => ({
      role: ((rp.roles as Record<string, unknown>)?.name as string) || '',
      resource: ((rp.permission_catalog as Record<string, unknown>)?.resource as string) || '',
      action: ((rp.permission_catalog as Record<string, unknown>)?.action as string) || '',
      allowed: (rp.granted as boolean) ?? true,
    }));

    return { organizationId: ctx.organizationId, overrides };
  } catch {
    return { organizationId: '', overrides: [] };
  }
}

export default async function PermissionsPage() {
  const { organizationId, overrides } = await getPermissionData();

  return (
    <TierGate feature="permissions">
<PageHeader
        title="Permissions"
        subtitle="Configure role-based access controls for your organization. Admins always have full access."
      />

      <PermissionMatrix organizationId={organizationId} overrides={overrides} />
    </TierGate>
  );
}
