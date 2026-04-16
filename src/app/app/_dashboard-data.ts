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
import { castRelation } from '@/lib/supabase/cast-relation';

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
  /* ── New widget data ──────────────────────────── */
  myTasks: Array<{
    id: string;
    title: string;
    priority: string;
    status: string;
    due_date: string | null;
  }>;
  upcomingEvents: Array<{
    id: string;
    name: string;
    starts_at: string | null;
    ends_at: string | null;
    status: string;
    slug: string;
  }>;
  notifications: Array<{
    id: string;
    title: string;
    body: string | null;
    type: string;
    priority: string;
    created_at: string;
    read: boolean;
    action_url: string | null;
  }>;
  unreadNotificationCount: number;
  overdueInvoices: number;
  completedProjects: number;
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
  myTasks: [],
  upcomingEvents: [],
  notifications: [],
  unreadNotificationCount: 0,
  overdueInvoices: 0,
  completedProjects: 0,
};

/* ─── Data Fetcher ──────────────────────────────────────── */

export async function getDashboardData(): Promise<{
  stats: DashboardStats;
  tier: SubscriptionTier;
}> {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return { stats: fallbackStats, tier: 'access' };
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { stats: fallbackStats, tier: 'access' };
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

    const tier = (org?.subscription_tier as SubscriptionTier) || 'access';

    // Core queries (all tiers)
    const [proposalsRes, activeRes, pipelineRes, pendingRes, activityRes, projectsRes] =
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

        // GAP-P28: Count from canonical projects table
        supabase
          .from('projects')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', orgId)
          .is('deleted_at', null)
          .in('status', ['active', 'in_progress']),
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
          const ownerName = castRelation<Record<string, string>>(d.users)?.full_name ?? 'Unassigned';
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

    // ── New widget queries ─────────────────────────────────

    // My Priority Tasks — top 5 assigned to current user, ordered by priority
    const priorityOrder = ['urgent', 'high', 'medium', 'low'];
    let myTasks: DashboardStats['myTasks'] = [];
    if (canAccessFeature(tier, 'tasks')) {
      const { data: taskRows } = await supabase
        .from('tasks')
        .select('id, title, priority, status, due_date')
        .eq('organization_id', orgId)
        .eq('assignee_id', user.id)
        .neq('status', 'done')
        .order('due_date', { ascending: true, nullsFirst: false })
        .limit(10);
      // Sort by priority rank client-side (DB lacks enum ordering)
      myTasks = (taskRows ?? [])
        .sort((a, b) => priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority))
        .slice(0, 5);
    }

    // Upcoming Events — next 5 within 14 days
    let upcomingEvents: DashboardStats['upcomingEvents'] = [];
    if (canAccessFeature(tier, 'events')) {
      const now = new Date().toISOString();
      const twoWeeks = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
      const { data: eventRows } = await supabase
        .from('events')
        .select('id, name, starts_at, ends_at, status, slug')
        .eq('organization_id', orgId)
        .gte('starts_at', now)
        .lte('starts_at', twoWeeks)
        .order('starts_at', { ascending: true })
        .limit(5);
      upcomingEvents = eventRows ?? [];
    }

    // Notifications — latest 5 unread for current user
    let notifications: DashboardStats['notifications'] = [];
    let unreadNotificationCount = 0;
    {
      const { data: notifRows, count: notifCount } = await supabase
        .from('notifications')
        .select('id, title, body, type, priority, created_at, read, action_url', { count: 'exact' })
        .eq('organization_id', orgId)
        .eq('user_id', user.id)
        .eq('read', false)
        .eq('archived', false)
        .order('created_at', { ascending: false })
        .limit(5);
      notifications = notifRows ?? [];
      unreadNotificationCount = notifCount ?? 0;
    }

    // Overdue Invoices
    let overdueInvoices = 0;
    if (canAccessFeature(tier, 'invoices')) {
      const { count: overdueCount } = await supabase
        .from('invoices')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .eq('status', 'overdue');
      overdueInvoices = overdueCount ?? 0;
    }

    // Project Completion (completed projects count)
    let completedProjects = 0;
    if (canAccessFeature(tier, 'projects')) {
      const { count: completedCount } = await supabase
        .from('projects')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .is('deleted_at', null)
        .eq('status', 'completed');
      completedProjects = completedCount ?? 0;
    }

    return {
      stats: {
        userName: firstName,
        totalProposals: proposalsRes.count ?? 0,
        activeProjects: Math.max(activeRes.count ?? 0, projectsRes.count ?? 0),
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
        myTasks,
        upcomingEvents,
        notifications,
        unreadNotificationCount,
        overdueInvoices,
        completedProjects,
      },
      tier,
    };
  } catch {
    return { stats: fallbackStats, tier: 'access' };
  }
}

/* ─── Helpers ───────────────────────────────────────────── */

export function tasksDueSummary(count: number): string {
  if (count === 0) return 'All clear!';
  if (count === 1) return '1 task needs attention';
  return `${count} tasks need attention`;
}
