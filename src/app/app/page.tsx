import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import { canAccessFeature } from '@/lib/subscription';
import { getDashboardData, tasksDueSummary, type StatCard } from './_dashboard-data';

/* ─────────────────────────────────────────────────────────
   Types
   ───────────────────────────────────────────────────────── */

interface QuickAction {
  label: string;
  href: string;
  icon: React.ReactNode;
}

/* ─────────────────────────────────────────────────────────
   Component
   ───────────────────────────────────────────────────────── */

export default async function DashboardPage() {
  const { stats, tier } = await getDashboardData();

  // Build stat cards based on tier
  const cards: StatCard[] = [
    {
      label: 'Total Proposals',
      value: String(stats.totalProposals),
      detail: 'All time',
      href: '/app/proposals',
    },
    {
      label: 'Active Projects',
      value: String(stats.activeProjects),
      detail: 'Approved / in production',
      href: '/app/pipeline',
    },
    {
      label: 'Revenue Pipeline',
      value: formatCurrency(stats.revenuePipeline),
      detail: 'Open proposals',
      href: '/app/pipeline',
    },
    {
      label: 'Pending Approvals',
      value: String(stats.pendingApprovals),
      detail: 'Sent / viewed / negotiating',
      href: '/app/proposals',
    },
  ];

  // Professional tier cards
  if (canAccessFeature(tier, 'automations')) {
    cards.push({
      label: 'Automations Run',
      value: String(stats.automationsRun),
      detail: 'Last 7 days',
      href: '/app/automations',
    });
  }

  if (canAccessFeature(tier, 'integrations')) {
    cards.push({
      label: 'Integrations Active',
      value: String(stats.integrationsSynced),
      detail: 'Connected & syncing',
      href: '/app/integrations',
    });
  }

  // Enterprise tier cards
  if (canAccessFeature(tier, 'time_tracking')) {
    cards.push({
      label: 'Hours This Week',
      value: stats.hoursLoggedThisWeek.toFixed(1),
      detail: 'Logged by all members',
      href: '/app/time',
    });
  }

  if (canAccessFeature(tier, 'tasks')) {
    cards.push({
      label: 'Tasks Due Today',
      value: String(stats.tasksDueToday),
      detail: tasksDueSummary(stats.tasksDueToday),
      href: '/app/tasks',
    });
  }

  if (canAccessFeature(tier, 'expenses')) {
    cards.push({
      label: 'Pending Expenses',
      value: String(stats.pendingExpenses),
      detail: 'Awaiting approval',
      href: '/app/expenses',
    });
  }

  if (canAccessFeature(tier, 'crew')) {
    cards.push({
      label: 'Crew Available',
      value: String(stats.crewAvailable),
      detail: 'Active crew members',
      href: '/app/crew',
    });
  }

  // Build quick actions based on tier
  const quickActions: QuickAction[] = [
    {
      label: 'New Proposal',
      href: '/app/proposals',
      icon: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 1H3a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V7l-6-6Z" />
          <path d="M10 1v6h6" />
        </svg>
      ),
    },
    {
      label: 'New Client',
      href: '/app/clients',
      icon: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M13 16v-1.5a3 3 0 0 0-3-3H5a3 3 0 0 0-3 3V16" />
          <circle cx="7.5" cy="5" r="3" />
          <line x1="15" y1="6" x2="15" y2="12" />
          <line x1="12" y1="9" x2="18" y2="9" />
        </svg>
      ),
    },
    {
      label: 'New Lead',
      href: '/app/leads',
      icon: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 9a7 7 0 1 1-3.3-5.95" />
          <path d="M16 2v5h-5" />
        </svg>
      ),
    },
  ];

  if (canAccessFeature(tier, 'time_tracking')) {
    quickActions.push({
      label: 'Log Time',
      href: '/app/time/timer',
      icon: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="9" r="7.5" />
          <path d="M9 4.5V9l3 1.5" />
        </svg>
      ),
    });
  }

  if (canAccessFeature(tier, 'expenses')) {
    quickActions.push({
      label: 'New Expense',
      href: '/app/expenses/new',
      icon: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="4" width="16" height="11" rx="1" />
          <path d="M1 8h16" />
          <path d="M5 12h3" />
        </svg>
      ),
    });
  }

  if (canAccessFeature(tier, 'tasks')) {
    quickActions.push({
      label: 'New Task',
      href: '/app/tasks',
      icon: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H4a1 1 0 0 0-1 1v14l4-2 2 2 2-2 4 2V3a1 1 0 0 0-1-1Z" />
          <path d="M7 7l2 2 3-3" />
        </svg>
      ),
    });
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Overview of your business activity.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="mb-8 flex flex-wrap gap-3">
        {quickActions.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="inline-flex items-center gap-2.5 rounded-lg border border-border bg-white px-4 py-2.5 text-sm font-medium text-foreground transition-[color,background-color,border-color,opacity,box-shadow] duration-normal hover:border-text-muted hover:shadow-sm"
          >
            <span className="text-text-muted">{action.icon}</span>
            {action.label}
          </Link>
        ))}
        <button
          className="inline-flex items-center gap-2 rounded-lg border border-dashed border-border px-4 py-2.5 text-sm font-medium text-text-muted transition-colors hover:border-text-muted hover:text-text-secondary"
          onClick={undefined}
          title="Press ⌘K to search"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="7" cy="7" r="4.5" />
            <line x1="10.5" y1="10.5" x2="14" y2="14" />
          </svg>
          ⌘K
        </button>
      </div>

      {/* Stat cards — dynamically sized grid based on card count */}
      <div
        className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${
          cards.length <= 4 ? 'lg:grid-cols-4' : cards.length <= 6 ? 'lg:grid-cols-3' : 'lg:grid-cols-4'
        }`}
      >
        {cards.map((card) => {
          const cardContent = (
            <>
              <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
                {card.label}
              </p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                {card.value}
              </p>
              <p className="mt-1 text-xs text-text-secondary">{card.detail}</p>
              {card.href && (
                <span className="mt-2 inline-block text-xs text-text-muted group-hover:text-foreground transition-colors">
                  View →
                </span>
              )}
            </>
          );

          const className = "group rounded-xl border border-border bg-white px-5 py-5 transition-[color,background-color,border-color,opacity,box-shadow] duration-normal hover:border-text-muted hover:shadow-sm";

          return card.href ? (
            <Link key={card.label} href={card.href} className={className}>
              {cardContent}
            </Link>
          ) : (
            <div key={card.label} className={className}>
              {cardContent}
            </div>
          );
        })}
      </div>

      {/* Pipeline breakdown */}
      {stats.pipelineSummary.length > 0 && (
        <div className="mt-8">
          <h2 className="text-base font-semibold text-foreground mb-4">
            Pipeline by Status
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {stats.pipelineSummary.map((item) => (
              <Link
                key={item.status}
                href="/app/pipeline"
                className="rounded-lg border border-border bg-white px-4 py-3 transition-[color,background-color,border-color,opacity,box-shadow] duration-normal hover:border-text-muted hover:shadow-sm"
              >
                <p className="text-xs font-medium capitalize text-text-secondary">
                  {item.status.replace(/_/g, ' ')}
                </p>
                <p className="mt-1 text-lg font-semibold text-foreground">
                  {item.count}
                </p>
                <p className="text-xs text-text-muted">
                  {formatCurrency(item.total_value)}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Sales Leaderboard */}
      {stats.leaderboard.length > 0 && (
        <div className="mt-8">
          <h2 className="text-base font-semibold text-foreground mb-4">
            Sales Leaderboard
          </h2>
          <div className="rounded-xl border border-border bg-white overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-bg-secondary">
                  <th className="px-5 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-text-muted w-8">#</th>
                  <th className="px-5 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Rep</th>
                  <th className="px-5 py-2.5 text-right text-xs font-medium uppercase tracking-wider text-text-muted">Deals Won</th>
                  <th className="px-5 py-2.5 text-right text-xs font-medium uppercase tracking-wider text-text-muted">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {stats.leaderboard.map((entry, idx) => (
                  <tr key={entry.name} className="transition-colors hover:bg-bg-secondary/50">
                    <td className="px-5 py-3 text-sm tabular-nums text-text-muted">
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`}
                    </td>
                    <td className="px-5 py-3 text-sm font-medium text-foreground">{entry.name}</td>
                    <td className="px-5 py-3 text-right text-sm tabular-nums text-foreground">{entry.deals_won}</td>
                    <td className="px-5 py-3 text-right text-sm tabular-nums font-medium text-foreground">
                      {formatCurrency(entry.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent activity */}
      {stats.recentActivity.length > 0 && (
        <div className="mt-8">
          <h2 className="text-base font-semibold text-foreground mb-4">
            Recent Activity
          </h2>
          <div className="rounded-xl border border-border bg-white divide-y divide-border">
            {stats.recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="px-5 py-3 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm text-foreground">
                    <span className="font-medium capitalize">
                      {activity.action.replace(/_/g, ' ')}
                    </span>{' '}
                    <span className="text-text-secondary">
                      {activity.entity_type.replace(/_/g, ' ')}
                    </span>
                  </p>
                </div>
                <p className="text-xs text-text-muted whitespace-nowrap">
                  {new Date(activity.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
