/**
 * Server-side dashboard data fetching for the authenticated dashboard page.
 *
 * Queries Supabase for proposal stats, pipeline summary, tier-gated metrics
 * (automations, time tracking, expenses, crew), and recent activity.
 *
 * @module app/app/_dashboard-data
 */

import { createClient } from '@/lib/supabase/server';
import { canAccessFeature } from '@/lib/subscription';
import type { SubscriptionTier } from '@/types/database';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';

/* ─── Types ─────────────────────────────────────────────── */

export interface DashboardStats {
  userName: string;
  totalProposals: number;
  activeProjects: number;
  revenuePipeline: number;
  pendingApprovals: number;
  automationsRun: number;
  integrationsSynced: number;
  hoursLoggedThisWeek: number;
  tasksDueToday: number;
  pendingExpenses: number;
  crewAvailable: number;
  recentActivity: Array<{
    id: string;
    action: string;
    entity_type: string;
    created_at: string;
  }>;
  pipelineSummary: Array<{
    status: string;
    count: number;
    total_value: number;
  }>;
  leaderboard: Array<{
    name: string;
    deals_won: number;
    revenue: number;
  }>;
}

export interface StatCard {
  label: string;
  value: string;
  detail: string;
  href?: string;
}

/* ─── Fallback ──────────────────────────────────────────── */

const fallbackStats: DashboardStats = {
  userName: 'there',
  totalProposals: 0,
  activeProjects: 0,
  revenuePipeline: 0,
  pendingApprovals: 0,
  automationsRun: 0,
  integrationsSynced: 0,
  hoursLoggedThisWeek: 0,
  tasksDueToday: 0,
  pendingExpenses: 0,
  crewAvailable: 0,
  recentActivity: [],
  pipelineSummary: [],
  leaderboard: [],
};

/* ─── Data Fetcher ──────────────────────────────────────── */

export async function getDashboardData(): Promise<{
  stats: DashboardStats;
  tier: SubscriptionTier;
}> {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) throw new Error('No auth');
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { stats: fallbackStats, tier: 'free' };
    const orgId = ctx.organizationId;

    // Fetch user's display name for greeting
    const { data: userData } = await supabase
      .from('users')
      .select('full_name')
      .eq('id', user.id)
      .single();
    const firstName = (userData?.full_name ?? 'there').split(' ')[0];

    // Get org tier
    const { data: org } = await supabase
      .from('organizations')
      .select('subscription_tier')
      .eq('id', orgId)
      .single();

    const tier = (org?.subscription_tier as SubscriptionTier) || 'free';

    // Core queries (all tiers)
    const [proposalsRes, activeRes, pipelineRes, pendingRes, activityRes] =
      await Promise.all([
        supabase
          .from('proposals')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', orgId),

        supabase
          .from('proposals')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', orgId)
          .in('status', ['approved', 'in_production', 'active']),

        supabase
          .from('proposals')
          .select('status, total_value')
          .eq('organization_id', orgId)
          .not('status', 'in', '("complete","cancelled")'),

        supabase
          .from('proposals')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', orgId)
          .in('status', ['sent', 'viewed', 'negotiating']),

        supabase
          .from('activity_log')
          .select('id, action, entity_type, created_at')
          .eq('organization_id', orgId)
          .order('created_at', { ascending: false })
          .limit(10),
      ]);

    // Pipeline aggregation
    const revenuePipeline = (pipelineRes.data ?? []).reduce(
      (sum, p) => sum + (p.total_value || 0),
      0,
    );

    const statusMap = new Map<string, { count: number; total_value: number }>();
    for (const p of pipelineRes.data ?? []) {
      const entry = statusMap.get(p.status) ?? { count: 0, total_value: 0 };
      entry.count++;
      entry.total_value += p.total_value || 0;
      statusMap.set(p.status, entry);
    }
    const pipelineSummary = Array.from(statusMap.entries()).map(
      ([status, data]) => ({ status, ...data }),
    );

    // Professional tier queries
    let automationsRun = 0;
    let integrationsSynced = 0;

    if (canAccessFeature(tier, 'automations')) {
      const { count } = await supabase
        .from('automation_runs')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .gte('started_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
      automationsRun = count ?? 0;
    }

    if (canAccessFeature(tier, 'integrations')) {
      const { count } = await supabase
        .from('integration_connections')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .eq('status', 'active');
      integrationsSynced = count ?? 0;
    }

    // Enterprise tier queries
    let hoursLoggedThisWeek = 0;
    let tasksDueToday = 0;
    let pendingExpenses = 0;
    let crewAvailable = 0;

    if (canAccessFeature(tier, 'time_tracking')) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);
      const { data: timeEntries } = await supabase
        .from('time_entries')
        .select('hours')
        .eq('organization_id', orgId)
        .gte('date', weekStart.toISOString().slice(0, 10));
      hoursLoggedThisWeek = (timeEntries ?? []).reduce(
        (sum, e) => sum + (e.hours || 0),
        0,
      );
    }

    if (canAccessFeature(tier, 'tasks')) {
      const today = new Date().toISOString().slice(0, 10);
      const { count } = await supabase
        .from('tasks')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .eq('due_date', today)
        .neq('status', 'done');
      tasksDueToday = count ?? 0;
    }

    if (canAccessFeature(tier, 'expenses')) {
      const { count } = await supabase
        .from('expenses')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending');
      pendingExpenses = count ?? 0;
    }

    if (canAccessFeature(tier, 'crew')) {
      const { count } = await supabase
        .from('crew_profiles')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .eq('status', 'active');
      crewAvailable = count ?? 0;
    }

    // Sales leaderboard (won deals grouped by owner)
    let leaderboard: DashboardStats['leaderboard'] = [];
    if (canAccessFeature(tier, 'pipeline')) {
      const { data: wonDeals } = await supabase
        .from('deals')
        .select('deal_value, owner_id, users!deals_owner_id_fkey(full_name)')
        .eq('organization_id', orgId)
        .eq('stage', 'contract_signed');

      if (wonDeals && wonDeals.length > 0) {
        const ownerMap = new Map<string, { name: string; deals: number; revenue: number }>();
        for (const d of wonDeals) {
          const ownerId = d.owner_id ?? 'unassigned';
          const ownerName = (d.users as unknown as Record<string, string>)?.full_name ?? 'Unassigned';
          const entry = ownerMap.get(ownerId) ?? { name: ownerName, deals: 0, revenue: 0 };
          entry.deals++;
          entry.revenue += d.deal_value ?? 0;
          ownerMap.set(ownerId, entry);
        }
        leaderboard = Array.from(ownerMap.values())
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5)
          .map((e) => ({ name: e.name, deals_won: e.deals, revenue: e.revenue }));
      }
    }

    return {
      stats: {
        userName: firstName,
        totalProposals: proposalsRes.count ?? 0,
        activeProjects: activeRes.count ?? 0,
        revenuePipeline,
        pendingApprovals: pendingRes.count ?? 0,
        automationsRun,
        integrationsSynced,
        hoursLoggedThisWeek,
        tasksDueToday,
        pendingExpenses,
        crewAvailable,
        recentActivity: activityRes.data ?? [],
        pipelineSummary,
        leaderboard,
      },
      tier,
    };
  } catch {
    return { stats: fallbackStats, tier: 'free' };
  }
}

/* ─── Helpers ───────────────────────────────────────────── */

export function tasksDueSummary(count: number): string {
  if (count === 0) return 'All clear!';
  if (count === 1) return '1 task needs attention';
  return `${count} tasks need attention`;
}
