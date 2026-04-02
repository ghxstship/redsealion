import { TierGate } from '@/components/shared/TierGate';
import PermissionMatrix from '@/components/admin/security/PermissionMatrix';
import { createClient } from '@/lib/supabase/server';

async function getPermissionData() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { organizationId: '', overrides: [] };

    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!userData) return { organizationId: '', overrides: [] };

    const organizationId = userData.organization_id as string;

    const { data: overrides } = await supabase
      .from('permissions')
      .select('role, resource, action, allowed')
      .eq('organization_id', organizationId);

    return {
      organizationId,
      overrides: (overrides ?? []) as Array<{
        role: string;
        resource: string;
        action: string;
        allowed: boolean;
      }>,
    };
  } catch {
    return { organizationId: '', overrides: [] };
  }
}

export default async function PermissionsPage() {
  const { organizationId, overrides } = await getPermissionData();

  return (
    <TierGate feature="permissions">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Permissions
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Configure role-based access controls for your organization. Admins always have full access.
        </p>
      </div>

      <PermissionMatrix organizationId={organizationId} overrides={overrides} />
    </TierGate>
  );
}
