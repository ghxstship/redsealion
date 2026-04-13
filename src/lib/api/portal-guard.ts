import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { PlatformRole } from '@/lib/permissions';
import { getPortalPermission } from '@/lib/permissions';

/**
 * Guard a portal-facing API route. Verifies the user is a client role
 * (client or community) and checks the portal permission.
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

  // Resolve role via organization_memberships (SSOT)
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

  const roleData = membership.roles as { name?: string | null } | null | undefined;
  const role = (roleData?.name ?? 'community') as PlatformRole;

  // Admin roles always have access (they can view the portal too)
  if (role === 'developer' || role === 'owner' || role === 'admin' || role === 'collaborator') {
    return null;
  }

  // Must be a client, viewer, or community role for portal access
  if (role !== 'client' && role !== 'viewer' && role !== 'community') {
    return NextResponse.json(
      { error: 'Forbidden', message: 'This endpoint is for portal users.' },
      { status: 403 },
    );
  }

  const allowed = getPortalPermission(role, permissionKey);

  if (!allowed) {
    return NextResponse.json(
      {
        error: 'Forbidden',
        message: `Your role (${role === 'client' ? 'Client' : role === 'viewer' ? 'Viewer' : 'Community'}) does not have permission for this action.`,
      },
      { status: 403 },
    );
  }

  return null;
}
