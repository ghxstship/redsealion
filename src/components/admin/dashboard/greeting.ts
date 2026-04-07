/**
 * Dashboard greeting utilities.
 *
 * Time-of-day greeting, contextual subtitle builder, and relative
 * timestamp formatter for the dashboard page.
 *
 * @module components/admin/dashboard/greeting
 */

/* ─── Time-of-Day Greeting ─────────────────────────────── */

export function getGreeting(hour: number, t?: (key: string) => string): string {
  if (hour < 12) return t ? t('dashboard.goodMorning') : 'Good morning';
  if (hour < 17) return t ? t('dashboard.goodAfternoon') : 'Good afternoon';
  return t ? t('dashboard.goodEvening') : 'Good evening';
}

/* ─── Contextual Subtitle ──────────────────────────────── */

interface SubtitleStats {
  tasksDueToday: number;
  pendingApprovals: number;
  pendingExpenses: number;
  activeProjects: number;
}

export function getContextualSubtitle(stats: SubtitleStats, t?: (key: string) => string): string {
  const parts: string[] = [];

  if (stats.tasksDueToday > 0) {
    if (t) {
      parts.push(`${stats.tasksDueToday} ${t('dashboard.tasksDue')}`);
    } else {
      parts.push(
        `${stats.tasksDueToday} task${stats.tasksDueToday === 1 ? '' : 's'} due today`,
      );
    }
  }

  if (stats.pendingApprovals > 0) {
    if (t) {
      parts.push(`${stats.pendingApprovals} ${t('dashboard.pendingApprovalCount')}`);
    } else {
      parts.push(
        `${stats.pendingApprovals} pending approval${stats.pendingApprovals === 1 ? '' : 's'}`,
      );
    }
  }

  if (stats.pendingExpenses > 0) {
    if (t) {
      parts.push(`${stats.pendingExpenses} ${t('dashboard.expensesAwaiting')}`);
    } else {
      parts.push(
        `${stats.pendingExpenses} expense${stats.pendingExpenses === 1 ? '' : 's'} awaiting review`,
      );
    }
  }

  if (parts.length === 0) {
    if (stats.activeProjects > 0) {
      return t 
        ? `${stats.activeProjects} ${t('dashboard.projectsInProduction')}`
        : `${stats.activeProjects} active project${stats.activeProjects === 1 ? '' : 's'} in production.`;
    }
    return t ? t('dashboard.everythingOnTrack') : 'Everything is on track. You\u2019re all caught up.';
  }

  return (t ? t('dashboard.youHave') : 'You have') + ' ' + parts.join(' \u00b7 ') + '.';
}

/* ─── Relative Timestamp ───────────────────────────────── */

export function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}
