import { createClient } from '@/lib/supabase/client';

/**
 * Client-side org resolution via organization_memberships.
 * Use this in 'use client' components instead of the server-side resolveCurrentOrg.
 */
export async function resolveClientOrg(): Promise<{ userId: string; organizationId: string } | null> {
  const supabase = createClient();
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
