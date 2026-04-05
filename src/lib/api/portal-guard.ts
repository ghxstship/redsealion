import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { OrganizationRole } from '@/types/database';
import { getPortalPermission } from '@/lib/permissions';

/**
 * Guard a portal-facing API route. Verifies the user is a client role
 * (client_primary or client_viewer) and checks the portal permission.
 *
 * Permission keys follow the pattern: "resource.action"
 * e.g., "proposals.approve", "invoices.pay", "files.upload"
 *
 * Returns null if access is granted, or a 401/403 NextResponse if denied.
 */
export async function requirePortalPermission(
  permissionKey: string,
): Promise<NextResponse | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Resolve role via organization_memberships (SSOT — users.role was dropped in 00033)
  const { data: membership } = await supabase
    .from('organization_memberships')
    .select('roles(name)')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('created_at', { ascending: true })
    .limit(1)
    .single();

  if (!membership) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const roleData = membership.roles as unknown as { name: string } | null;
  const role = (roleData?.name ?? 'org_admin') as OrganizationRole;

  // Admin roles always have access (they can view the portal too)
  if (role === 'super_admin' || role === 'org_admin' || role === 'project_manager') {
    return null;
  }

  // Must be a client role
  if (role !== 'client_primary' && role !== 'client_viewer') {
    return NextResponse.json(
      { error: 'Forbidden', message: 'This endpoint is for client portal users.' },
      { status: 403 },
    );
  }

  const allowed = getPortalPermission(role, permissionKey);

  if (!allowed) {
    return NextResponse.json(
      {
        error: 'Forbidden',
        message: `Your role (${role === 'client_primary' ? 'Primary Contact' : 'Viewer'}) does not have permission for this action.`,
      },
      { status: 403 },
    );
  }

  return null;
}
