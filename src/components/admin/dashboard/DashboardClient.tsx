'use client';

/**
 * Dashboard client component — renders the interactive dashboard UI
 * with personalized greeting, animated stat cards, pipeline summary,
 * sales leaderboard, activity feed, and new command-center widgets:
 * Priority Tasks, Upcoming Schedule, Notifications, and Quick Actions.
 *
 * Data is fetched server-side and passed as props. This component
 * handles client-only concerns: time-of-day greeting, staggered
 * entrance animations, relative timestamps, and empty states.
 *
 * Widget layout inspired by ClickUp, HubSpot, Monday.com, Asana,
 * and Salesforce SaaS dashboard patterns.
 *
 * @module components/admin/dashboard/DashboardClient
 */

import { useMemo, useSyncExternalStore } from 'react';
import Link from 'next/link';
import {
  CirclePlus,
  RefreshCw,
  CircleMinus,
  CircleDot,
  LayoutDashboard,
  CheckCircle2,
  ListTodo,
  CalendarDays,
  Bell,
  Zap,
  FileText,
  UserPlus,
  UserRoundSearch,
  ClipboardList,
  Receipt,
  CalendarPlus,
  AlertCircle,
  Info,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import EmptyState from '@/components/ui/EmptyState';
import StatusBadge from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button';
import { TASK_PRIORITY_COLORS, TASK_STATUS_COLORS, EVENT_STATUS_COLORS } from '@/components/ui/StatusBadge';
import type { DashboardStats, StatCard } from '@/app/app/_dashboard-data';
import type { SubscriptionTier } from '@/types/database';
import { canAccessFeature } from '@/lib/subscription';
import { getGreeting, getContextualSubtitle, timeAgo } from './greeting';
import { useTranslation } from '@/lib/i18n/client';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';

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

/* ─── Notification Type Icons ──────────────────────────── */

const NOTIF_TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string }> = {
  info: { icon: <Info size={14} />, color: 'text-blue-500' },
  warning: { icon: <AlertTriangle size={14} />, color: 'text-amber-500' },
  error: { icon: <AlertCircle size={14} />, color: 'text-red-500' },
  success: { icon: <CheckCircle size={14} />, color: 'text-green-500' },
};

function getNotifConfig(type: string) {
  return NOTIF_TYPE_CONFIG[type] ?? NOTIF_TYPE_CONFIG.info;
}

/* ─── Due Date Formatter ───────────────────────────────── */

function formatDueDate(dateStr: string | null, t: (key: string) => string): { label: string; isOverdue: boolean; isDueToday: boolean } {
  if (!dateStr) return { label: t('dashboard.noDueDate'), isOverdue: false, isDueToday: false };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dateStr + 'T00:00:00');
  const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { label: t('dashboard.overdue'), isOverdue: true, isDueToday: false };
  if (diffDays === 0) return { label: t('dashboard.dueToday'), isOverdue: false, isDueToday: true };

  return {
    label: `${t('dashboard.dueDatePrefix')} ${due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`,
    isOverdue: false,
    isDueToday: false,
  };
}

/* ─── Event Date Formatter ─────────────────────────────── */

function formatEventDate(startStr: string | null): { day: string; month: string; full: string } {
  if (!startStr) return { day: '--', month: '---', full: '' };
  const d = new Date(startStr);
  return {
    day: String(d.getDate()),
    month: d.toLocaleDateString(undefined, { month: 'short' }),
    full: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }),
  };
}

/* ─── Types ─────────────────────────────────────────────── */

interface DashboardClientProps {
  stats: DashboardStats;
  cards: StatCard[];
  tier: SubscriptionTier;
}

const subscribeNoop = () => () => {};
const getSnapshotTrue = () => true;
const getSnapshotFalse = () => false;

/* ─── Widget Section Header ────────────────────────────── */

function WidgetHeader({
  icon,
  title,
  badge,
  linkHref,
  linkLabel,
}: {
  icon: React.ReactNode;
  title: string;
  badge?: React.ReactNode;
  linkHref: string;
  linkLabel: string;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <span className="text-text-muted">{icon}</span>
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {badge}
      </div>
      <Link href={linkHref} className="text-xs text-text-muted hover:text-foreground transition-colors duration-fast">
        {linkLabel}
      </Link>
    </div>
  );
}

/* ─── Component ─────────────────────────────────────────── */

export default function DashboardClient({ stats, cards, tier }: DashboardClientProps) {
  const mounted = useSyncExternalStore(subscribeNoop, getSnapshotTrue, getSnapshotFalse);
  const { t } = useTranslation();

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    return getGreeting(hour, t);
  }, [t]);

  const subtitle = getContextualSubtitle(stats, t);

  const isEmptyOrg =
    stats.totalProposals === 0 &&
    stats.activeProjects === 0 &&
    stats.pendingApprovals === 0 &&
    stats.recentActivity.length === 0;

  // Determine which widgets to show based on tier
  const showTasks = canAccessFeature(tier, 'tasks');
  const showEvents = canAccessFeature(tier, 'events');
  const showWidgets = showTasks || showEvents || stats.notifications.length > 0;

  // Quick actions — tier-gated list
  const quickActions = useMemo(() => {
    const actions = [
      { label: t('dashboard.newProposal'), href: '/app/proposals/new', icon: <FileText size={16} />, feature: 'proposals' as const },
      { label: t('dashboard.newClient'), href: '/app/clients/new', icon: <UserPlus size={16} />, feature: 'clients' as const },
      { label: t('dashboard.newLead'), href: '/app/leads/new', icon: <UserRoundSearch size={16} />, feature: 'leads' as const },
      { label: t('dashboard.newTask'), href: '/app/tasks', icon: <ClipboardList size={16} />, feature: 'tasks' as const },
      { label: t('dashboard.newInvoice'), href: '/app/invoices/new', icon: <Receipt size={16} />, feature: 'invoices' as const },
      { label: t('dashboard.newEvent'), href: '/app/events/new', icon: <CalendarPlus size={16} />, feature: 'events' as const },
    ];
    return actions.filter((a) => canAccessFeature(tier, a.feature));
  }, [tier, t]);

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
                className="inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors duration-fast hover:bg-foreground/90"
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

          {/* ────────────────────────────────────────────────────
              New Command Center Widgets
              Inspired by ClickUp, Monday.com, HubSpot, Asana, Salesforce
             ──────────────────────────────────────────────────── */}
          {showWidgets && (
            <div
              className={`mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2 ${mounted ? 'animate-slide-up' : ''}`}
              style={{ animationDelay: `${cards.length * 50 + 80}ms` }}
            >
              {/* ─── ① My Priority Tasks ────────────────────────── */}
              {showTasks && (
                <div className="surface overflow-hidden" id="widget-priority-tasks">
                  <div className="px-5 pt-5">
                    <WidgetHeader
                      icon={<ListTodo size={18} />}
                      title={t('dashboard.myPriorityTasks')}
                      linkHref="/app/my-tasks"
                      linkLabel={t('dashboard.viewAllTasks')}
                    />
                  </div>
                  {stats.myTasks.length === 0 ? (
                    <div className="px-5 pb-5">
                      <EmptyState
                        icon={<CheckCircle2 size={36} className="text-green-500" />}
                        message={t('dashboard.noTasksAssigned')}
                      />
                    </div>
                  ) : (
                    <div >
                      {stats.myTasks.map((task) => {
                        const dueInfo = formatDueDate(task.due_date, t);
                        return (
                          <Link
                            key={task.id}
                            href={`/app/tasks`}
                            className="flex items-center gap-3 px-5 py-3 transition-colors duration-fast hover:bg-bg-secondary/50"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-foreground truncate">
                                {task.title}
                              </p>
                              <div className="mt-1 flex items-center gap-2">
                                <StatusBadge status={task.priority} colorMap={TASK_PRIORITY_COLORS} />
                                <StatusBadge status={task.status} colorMap={TASK_STATUS_COLORS} />
                              </div>
                            </div>
                            <span
                              className={`shrink-0 text-xs whitespace-nowrap tabular-nums ${
                                dueInfo.isOverdue
                                  ? 'text-red-600 font-medium'
                                  : dueInfo.isDueToday
                                    ? 'text-amber-600 font-medium'
                                    : 'text-text-muted'
                              }`}
                            >
                              {dueInfo.label}
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ─── ② Upcoming Schedule ─────────────────────────── */}
              {showEvents && (
                <div className="surface overflow-hidden" id="widget-upcoming-schedule">
                  <div className="px-5 pt-5">
                    <WidgetHeader
                      icon={<CalendarDays size={18} />}
                      title={t('dashboard.upcomingSchedule')}
                      linkHref="/app/events"
                      linkLabel={t('dashboard.viewAllEvents')}
                    />
                  </div>
                  {stats.upcomingEvents.length === 0 ? (
                    <div className="px-5 pb-5">
                      <EmptyState
                        icon={<CalendarDays size={36} className="text-text-muted" />}
                        message={t('dashboard.noUpcomingEvents')}
                      />
                    </div>
                  ) : (
                    <div >
                      {stats.upcomingEvents.map((event) => {
                        const dateInfo = formatEventDate(event.starts_at);
                        return (
                          <Link
                            key={event.id}
                            href={`/app/events/${event.slug}`}
                            className="flex items-center gap-3 px-5 py-3 transition-colors duration-fast hover:bg-bg-secondary/50"
                          >
                            {/* Calendar mini gutter */}
                            <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg bg-bg-secondary">
                              <span className="text-[10px] font-medium uppercase leading-none text-text-muted">
                                {dateInfo.month}
                              </span>
                              <span className="text-base font-semibold leading-tight text-foreground tabular-nums">
                                {dateInfo.day}
                              </span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-foreground truncate">
                                {event.name}
                              </p>
                              <p className="mt-0.5 text-xs text-text-muted">{dateInfo.full}</p>
                            </div>
                            <StatusBadge status={event.status} colorMap={EVENT_STATUS_COLORS} />
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ─── ③ Notifications Feed ─────────────────────────── */}
              <div className="surface overflow-hidden" id="widget-notifications">
                <div className="px-5 pt-5">
                  <WidgetHeader
                    icon={<Bell size={18} />}
                    title={t('dashboard.notifications')}
                    badge={
                      stats.unreadNotificationCount > 0 ? (
                        <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700 tabular-nums">
                          {stats.unreadNotificationCount} {t('dashboard.unreadCount')}
                        </span>
                      ) : undefined
                    }
                    linkHref="/app/my-inbox"
                    linkLabel={t('dashboard.viewAllNotifications')}
                  />
                </div>
                {stats.notifications.length === 0 ? (
                  <div className="px-5 pb-5">
                    <EmptyState
                      icon={<CheckCircle2 size={36} className="text-green-500" />}
                      message={t('dashboard.noNewNotifications')}
                    />
                  </div>
                ) : (
                  <div >
                    {stats.notifications.map((notif) => {
                      const config = getNotifConfig(notif.type);
                      return (
                        <div
                          key={notif.id}
                          className="flex items-start gap-3 px-5 py-3 transition-colors duration-fast hover:bg-bg-secondary/50"
                        >
                          <span className={`mt-0.5 shrink-0 ${config.color}`}>
                            {config.icon}
                          </span>
                          <div className="min-w-0 flex-1">
                            {notif.action_url ? (
                              <Link href={notif.action_url} className="text-sm font-medium text-foreground hover:underline truncate block">
                                {notif.title}
                              </Link>
                            ) : (
                              <p className="text-sm font-medium text-foreground truncate">
                                {notif.title}
                              </p>
                            )}
                            {notif.body && (
                              <p className="mt-0.5 text-xs text-text-secondary line-clamp-1">
                                {notif.body}
                              </p>
                            )}
                          </div>
                          <span className="shrink-0 text-xs text-text-muted whitespace-nowrap tabular-nums">
                            {timeAgo(notif.created_at)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ─── ④ Quick Actions ──────────────────────────────── */}
              <div className="surface px-5 py-5" id="widget-quick-actions">
                <WidgetHeader
                  icon={<Zap size={18} />}
                  title={t('dashboard.quickActions')}
                  linkHref="/app/proposals/new"
                  linkLabel=""
                />
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {quickActions.map((action) => (
                    <Button
                      key={action.href}
                      variant="secondary"
                      size="sm"
                      href={action.href}
                      className="justify-start gap-2"
                    >
                      {action.icon}
                      {action.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

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
                <div className="overflow-x-auto">
                  <Table >
                    <TableHeader>
                      <TableRow className="border-b border-border bg-bg-secondary">
                        <TableHead className="px-5 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-text-muted w-8">
                          #
                        </TableHead>
                        <TableHead className="px-5 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-text-muted">
                          {t('dashboard.rep')}
                        </TableHead>
                        <TableHead className="px-5 py-2.5 text-right text-xs font-medium uppercase tracking-wider text-text-muted">
                          {t('dashboard.dealsWon')}
                        </TableHead>
                        <TableHead className="px-5 py-2.5 text-right text-xs font-medium uppercase tracking-wider text-text-muted">
                          {t('dashboard.revenue')}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody >
                      {stats.leaderboard.map((entry, idx) => (
                        <TableRow
                          key={entry.name}
                          className="transition-colors duration-fast hover:bg-bg-secondary/50"
                        >
                          <TableCell className="px-5 py-3 text-sm tabular-nums text-text-muted">
                            {idx === 0
                              ? '🥇'
                              : idx === 1
                                ? '🥈'
                                : idx === 2
                                  ? '🥉'
                                  : `${idx + 1}`}
                          </TableCell>
                          <TableCell className="px-5 py-3 text-sm font-medium text-foreground">
                            {entry.name}
                          </TableCell>
                          <TableCell className="px-5 py-3 text-right text-sm tabular-nums text-foreground">
                            {entry.deals_won}
                          </TableCell>
                          <TableCell className="px-5 py-3 text-right text-sm tabular-nums font-medium text-foreground">
                            {formatCurrency(entry.revenue)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
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
