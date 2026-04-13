import { createClient } from '@/lib/supabase/server';

/**
 * Resolves the current authenticated user's active organization ID.
 * Reads from the RBAC organization_memberships table (SSOT).
 *
 * @returns { userId, organizationId } or null if not authenticated / no membership
 */
export async function resolveCurrentOrg(): Promise<{ userId: string; organizationId: string } | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: membership } = await supabase
    .from('organization_memberships')
    .select('organization_id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('created_at', { ascending: true })
    .limit(1)
    .single();

  if (!membership) return null;

  return {
    userId: user.id,
    organizationId: membership.organization_id as string,
  };
}
