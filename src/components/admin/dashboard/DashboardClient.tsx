'use client';

/**
 * Dashboard client component — renders the interactive dashboard UI
 * with personalized greeting, animated stat cards, pipeline summary,
 * sales leaderboard, and activity feed.
 *
 * Data is fetched server-side and passed as props. This component
 * handles client-only concerns: time-of-day greeting, staggered
 * entrance animations, relative timestamps, and empty states.
 *
 * @module components/admin/dashboard/DashboardClient
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CirclePlus, RefreshCw, CircleMinus, CircleDot, LayoutDashboard } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import EmptyState from '@/components/ui/EmptyState';
import type { DashboardStats, StatCard } from '@/app/app/_dashboard-data';
import { getGreeting, getContextualSubtitle, timeAgo } from './greeting';
import { useTranslation } from '@/lib/i18n/client';

/* ─── Action Icons ─────────────────────────────────────── */

const ACTION_ICONS: Record<string, React.ReactNode> = {
  created: <CirclePlus size={14} className="text-success" />,
  updated: <RefreshCw size={14} className="text-text-muted" />,
  deleted: <CircleMinus size={14} className="text-error" />,
};

function getActionIcon(action: string): React.ReactNode {
  for (const [key, icon] of Object.entries(ACTION_ICONS)) {
    if (action.toLowerCase().includes(key)) return icon;
  }
  return <CircleDot size={14} className="text-text-muted" />;
}

/* ─── Types ─────────────────────────────────────────────── */

interface DashboardClientProps {
  stats: DashboardStats;
  cards: StatCard[];
}

/* ─── Component ─────────────────────────────────────────── */

export default function DashboardClient({ stats, cards }: DashboardClientProps) {
  const [greeting, setGreeting] = useState('Hello');
  const [mounted, setMounted] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const hour = new Date().getHours();
    setGreeting(getGreeting(hour, t));
    setMounted(true);
  }, [t]);

  const subtitle = getContextualSubtitle(stats, t);

  const isEmptyOrg =
    stats.totalProposals === 0 &&
    stats.activeProjects === 0 &&
    stats.pendingApprovals === 0 &&
    stats.recentActivity.length === 0;

  return (
    <>
      {/* ─── Greeting ──────────────────────────────────────── */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {greeting}, {stats.userName}
        </h1>
        <p className="mt-1 text-sm text-text-secondary">{subtitle}</p>
      </div>

      {/* ─── Empty State ───────────────────────────────────── */}
      {isEmptyOrg ? (
        <div className="mt-4">
          <EmptyState
            icon={<LayoutDashboard size={48} className="text-text-muted" />}
            message={t('dashboard.emptyStateTitle')}
            description={t('dashboard.emptyStateDesc')}
            action={
              <Link
                href="/app/proposals/new"
                className="inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-white transition-colors duration-fast hover:bg-foreground/90"
              >
                {t('dashboard.createProposal')}
              </Link>
            }
          />
        </div>
      ) : (
        <>
          {/* ─── Stat Cards ──────────────────────────────────── */}
          <div
            className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${
              cards.length <= 4
                ? 'lg:grid-cols-4'
                : cards.length <= 6
                  ? 'lg:grid-cols-3'
                  : 'lg:grid-cols-4'
            }`}
          >
            {cards.map((card, idx) => {
              const delay = `${idx * 50}ms`;
              const cardContent = (
                <>
                  <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
                    {t(card.label)}
                  </p>
                  <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground tabular-nums">
                    {card.value}
                  </p>
                  <p className="mt-1 text-xs text-text-secondary">{t(card.detail)}</p>
                  {card.href && (
                    <span className="mt-2 inline-block text-xs text-text-muted group-hover:text-foreground transition-colors duration-fast">
                      {t('dashboard.view')}
                    </span>
                  )}
                </>
              );

              const className = `group surface px-5 py-5 hover-lift ${
                mounted ? 'animate-slide-up' : ''
              }`;

              return card.href ? (
                <Link
                  key={card.label}
                  href={card.href}
                  className={className}
                  style={{ animationDelay: delay }}
                >
                  {cardContent}
                </Link>
              ) : (
                <div
                  key={card.label}
                  className={className}
                  style={{ animationDelay: delay }}
                >
                  {cardContent}
                </div>
              );
            })}
          </div>

          {/* ─── Pipeline by Status ──────────────────────────── */}
          {stats.pipelineSummary.length > 0 && (
            <div
              className={`mt-8 ${mounted ? 'animate-slide-up' : ''}`}
              style={{ animationDelay: `${cards.length * 50 + 100}ms` }}
            >
              <h2 className="text-base font-semibold text-foreground mb-4">
                {t('dashboard.pipelineByStatus')}
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {stats.pipelineSummary.map((item) => (
                  <Link
                    key={item.status}
                    href="/app/pipeline"
                    className="surface px-4 py-3 hover-lift"
                  >
                    <p className="text-xs font-medium capitalize text-text-secondary">
                      {item.status.replace(/_/g, ' ')}
                    </p>
                    <p className="mt-1 text-lg font-semibold text-foreground tabular-nums">
                      {item.count}
                    </p>
                    <p className="text-xs text-text-muted tabular-nums">
                      {formatCurrency(item.total_value)}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* ─── Sales Leaderboard ───────────────────────────── */}
          {stats.leaderboard.length > 0 && (
            <div
              className={`mt-8 ${mounted ? 'animate-slide-up' : ''}`}
              style={{ animationDelay: `${cards.length * 50 + 200}ms` }}
            >
              <h2 className="text-base font-semibold text-foreground mb-4">
                {t('dashboard.salesLeaderboard')}
              </h2>
              <div className="surface overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-bg-secondary">
                      <th className="px-5 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-text-muted w-8">
                        #
                      </th>
                      <th className="px-5 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-text-muted">
                        {t('dashboard.rep')}
                      </th>
                      <th className="px-5 py-2.5 text-right text-xs font-medium uppercase tracking-wider text-text-muted">
                        {t('dashboard.dealsWon')}
                      </th>
                      <th className="px-5 py-2.5 text-right text-xs font-medium uppercase tracking-wider text-text-muted">
                        {t('dashboard.revenue')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {stats.leaderboard.map((entry, idx) => (
                      <tr
                        key={entry.name}
                        className="transition-colors duration-fast hover:bg-bg-secondary/50"
                      >
                        <td className="px-5 py-3 text-sm tabular-nums text-text-muted">
                          {idx === 0
                            ? '🥇'
                            : idx === 1
                              ? '🥈'
                              : idx === 2
                                ? '🥉'
                                : `${idx + 1}`}
                        </td>
                        <td className="px-5 py-3 text-sm font-medium text-foreground">
                          {entry.name}
                        </td>
                        <td className="px-5 py-3 text-right text-sm tabular-nums text-foreground">
                          {entry.deals_won}
                        </td>
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

          {/* ─── Recent Activity ─────────────────────────────── */}
          {stats.recentActivity.length > 0 && (
            <div
              className={`mt-8 ${mounted ? 'animate-slide-up' : ''}`}
              style={{ animationDelay: `${cards.length * 50 + 300}ms` }}
            >
              <h2 className="text-base font-semibold text-foreground mb-4">
                {t('dashboard.recentActivity')}
              </h2>
              <div className="surface divide-y divide-border overflow-hidden">
                {stats.recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="px-5 py-3 flex items-center gap-3 transition-colors duration-fast hover:bg-bg-secondary/50"
                  >
                    <span className="shrink-0">
                      {getActionIcon(activity.action)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-foreground truncate">
                        <span className="font-medium capitalize">
                          {activity.action.replace(/_/g, ' ')}
                        </span>{' '}
                        <span className="text-text-secondary">
                          {activity.entity_type.replace(/_/g, ' ')}
                        </span>
                      </p>
                    </div>
                    <p className="text-xs text-text-muted whitespace-nowrap tabular-nums">
                      {timeAgo(activity.created_at)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
