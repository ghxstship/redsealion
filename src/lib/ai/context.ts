import type { SupabaseClient } from '@supabase/supabase-js';

export interface AiContext {
  organizationName: string;
  proposalCount: number;
  teamSize: number;
  activeProjects: number;
  recentProposals: Array<{ name: string; status: string; value: number }>;
}

export async function gatherContext(
  supabase: SupabaseClient,
  userId: string
): Promise<AiContext> {
  const fallback: AiContext = {
    organizationName: 'Your Organization',
    proposalCount: 0,
    teamSize: 0,
    activeProjects: 0,
    recentProposals: [],
  };

  try {
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', userId)
      .single();

    if (!userData) return fallback;

    const orgId = userData.organization_id;

    const [orgRes, proposalCountRes, teamRes, activeRes, recentRes] = await Promise.all([
      supabase.from('organizations').select('name').eq('id', orgId).single(),
      supabase
        .from('proposals')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId),
      supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId),
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
      proposalCount: proposalCountRes.count ?? 0,
      teamSize: teamRes.count ?? 0,
      activeProjects: activeRes.count ?? 0,
      recentProposals: (recentRes.data ?? []).map((p) => ({
        name: p.name,
        status: p.status,
        value: p.total_value,
      })),
    };
  } catch {
    return fallback;
  }
}
