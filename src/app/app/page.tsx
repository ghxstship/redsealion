import { formatCurrency } from '@/lib/utils';
import { canAccessFeature } from '@/lib/subscription';
import { getDashboardData, tasksDueSummary, type StatCard } from './_dashboard-data';
import DashboardClient from '@/components/admin/dashboard/DashboardClient';

/* ─────────────────────────────────────────────────────────
   Dashboard Page (Server Shell)

   Fetches all data server-side, builds the stat card array
   based on the org's subscription tier, then delegates
   rendering to the DashboardClient component.
   ───────────────────────────────────────────────────────── */

export default async function DashboardPage() {
  const { stats, tier } = await getDashboardData();

  // Build stat cards based on tier
  const cards: StatCard[] = [
    {
      label: 'dashboard.totalProposals',
      value: String(stats.totalProposals),
      detail: 'dashboard.allTime',
      href: '/app/proposals',
    },
    {
      label: 'dashboard.activeProjects',
      value: String(stats.activeProjects),
      detail: 'dashboard.approvedInProduction',
      href: '/app/pipeline',
    },
    {
      label: 'dashboard.revenuePipeline',
      value: formatCurrency(stats.revenuePipeline),
      detail: 'dashboard.openProposals',
      href: '/app/pipeline',
    },
    {
      label: 'dashboard.pendingApprovals',
      value: String(stats.pendingApprovals),
      detail: 'dashboard.sentViewedNegotiating',
      href: '/app/proposals',
    },
  ];

  // Professional tier cards
  if (canAccessFeature(tier, 'automations')) {
    cards.push({
      label: 'dashboard.automationsRun',
      value: String(stats.automationsRun),
      detail: 'dashboard.last7Days',
      href: '/app/automations',
    });
  }

  if (canAccessFeature(tier, 'integrations')) {
    cards.push({
      label: 'dashboard.integrationsActive',
      value: String(stats.integrationsSynced),
      detail: 'dashboard.connectedSyncing',
      href: '/app/integrations',
    });
  }

  // Enterprise tier cards
  if (canAccessFeature(tier, 'time_tracking')) {
    cards.push({
      label: 'dashboard.hoursThisWeek',
      value: stats.hoursLoggedThisWeek.toFixed(1),
      detail: 'dashboard.loggedByAllMembers',
      href: '/app/time',
    });
  }

  if (canAccessFeature(tier, 'tasks')) {
    cards.push({
      label: 'dashboard.tasksDueToday',
      value: String(stats.tasksDueToday),
      detail: tasksDueSummary(stats.tasksDueToday),
      href: '/app/tasks',
    });
  }

  if (canAccessFeature(tier, 'expenses')) {
    cards.push({
      label: 'dashboard.pendingExpenses',
      value: String(stats.pendingExpenses),
      detail: 'dashboard.awaitingApproval',
      href: '/app/expenses',
    });
  }

  if (canAccessFeature(tier, 'crew')) {
    cards.push({
      label: 'dashboard.crewAvailable',
      value: String(stats.crewAvailable),
      detail: 'dashboard.activeCrewMembers',
      href: '/app/crew',
    });
  }

  // Overdue invoices — urgent attention signal (HubSpot / Salesforce pattern)
  if (stats.overdueInvoices > 0) {
    cards.push({
      label: 'dashboard.overdueInvoicesStat',
      value: String(stats.overdueInvoices),
      detail: 'dashboard.needsAttention',
      href: '/app/invoices',
    });
  }

  return <DashboardClient stats={stats} cards={cards} tier={tier} />;
}
