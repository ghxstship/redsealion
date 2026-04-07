'use client';

import { useRouter, usePathname } from 'next/navigation';
import Tabs from '@/components/ui/Tabs';

type TimeTab = 'timesheet' | 'timer' | 'approvals';

const TABS: Array<{ key: TimeTab; label: string }> = [
  { key: 'timesheet', label: 'My Time' },
  { key: 'timer', label: 'Timer' },
  { key: 'approvals', label: 'Approvals' },
];

const TAB_ROUTES: Record<TimeTab, string> = {
  timesheet: '/app/time',
  timer: '/app/time/timer',
  approvals: '/app/time/timesheets',
};

function getActiveTab(pathname: string): TimeTab {
  if (pathname.includes('/timer')) return 'timer';
  if (pathname.includes('/timesheets')) return 'approvals';
  return 'timesheet';
}

export default function TimeHubTabs({ pendingCount = 0 }: { pendingCount?: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const activeTab = getActiveTab(pathname);

  const tabsWithCounts = TABS.map((tab) => ({
    ...tab,
    count: tab.key === 'approvals' && pendingCount > 0 ? pendingCount : undefined,
  }));

  return (
    <Tabs
      tabs={tabsWithCounts}
      activeTab={activeTab}
      onTabChange={(key) => router.push(TAB_ROUTES[key])}
      className="mb-8"
    />
  );
}
