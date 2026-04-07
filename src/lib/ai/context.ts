/**
 * AI context gathering — builds rich context for copilot system prompt.
 *
 * Gathers organization metadata, user permissions, current page/entity
 * context, and recent activity to give Claude full situational awareness.
 *
 * @module lib/ai/context
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export interface AiContext {
  organizationName: string;
  organizationId: string;
  currency: string;
  proposalCount: number;
  teamSize: number;
  activeProjects: number;
  recentProposals: Array<{ name: string; status: string; value: number }>;
  userRole: string;
  userName: string;
  /** Current page the user is viewing (e.g., '/app/proposals') */
  currentPage?: string;
  /** If viewing a specific entity, its type and name */
  entityContext?: { type: string; name: string; id: string };
}

export async function gatherContext(
  supabase: SupabaseClient,
  userId: string,
  extra?: { currentPage?: string; entityContext?: AiContext['entityContext'] }
): Promise<AiContext> {
  const fallback: AiContext = {
    organizationName: 'Your Organization',
    organizationId: '',
    currency: 'USD',
    proposalCount: 0,
    teamSize: 0,
    activeProjects: 0,
    recentProposals: [],
    userRole: 'member',
    userName: 'User',
    currentPage: extra?.currentPage,
    entityContext: extra?.entityContext,
  };

  try {
    // Use organization_memberships to resolve org (SSOT)
    const { data: membership } = await supabase
      .from('organization_memberships')
      .select('organization_id, roles(name)')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    if (!membership) return fallback;

    const orgId = membership.organization_id as string;
    const roleData = membership.roles as unknown as { name: string } | null;
    const userRole = roleData?.name || 'member';

    const [orgRes, userRes, proposalCountRes, teamRes, activeRes, recentRes] =
      await Promise.all([
        supabase.from('organizations').select('name, currency').eq('id', orgId).single(),
        supabase.from('users').select('full_name').eq('id', userId).single(),
        supabase
          .from('proposals')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', orgId),
        supabase
          .from('organization_memberships')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', orgId)
          .eq('status', 'active'),
        supabase
          .from('proposals')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', orgId)
          .in('status', ['approved', 'in_production', 'active']),
        supabase
          .from('proposals')
          .select('name, status, total_value')
          .eq('organization_id', orgId)
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

    return {
      organizationName: orgRes.data?.name ?? 'Your Organization',
      organizationId: orgId,
      currency: orgRes.data?.currency ?? 'USD',
      proposalCount: proposalCountRes.count ?? 0,
      teamSize: teamRes.count ?? 0,
      activeProjects: activeRes.count ?? 0,
      recentProposals: (recentRes.data ?? []).map((p) => ({
        name: p.name,
        status: p.status,
        value: p.total_value,
      })),
      userRole,
      userName: userRes.data?.full_name ?? 'User',
      currentPage: extra?.currentPage,
      entityContext: extra?.entityContext,
    };
  } catch {
    return fallback;
  }
}
