'use client';

import { useRouter, usePathname } from 'next/navigation';
import Tabs from '@/components/ui/Tabs';

type ScheduleTab = 'timeline' | 'build-strike' | 'run-of-show' | 'milestones';

const TABS: Array<{ key: ScheduleTab; label: string }> = [
  { key: 'timeline', label: 'Timeline' },
  { key: 'build-strike', label: 'Build & Strike' },
  { key: 'run-of-show', label: 'Run of Show' },
  { key: 'milestones', label: 'Milestones' },
];

const TAB_ROUTES: Record<ScheduleTab, string> = {
  timeline: '/app/schedule',
  'build-strike': '/app/schedule/build-strike',
  'run-of-show': '/app/schedule/run-of-show',
  milestones: '/app/schedule/milestones',
};

function getActiveTab(pathname: string): ScheduleTab {
  if (pathname.includes('/build-strike')) return 'build-strike';
  if (pathname.includes('/run-of-show')) return 'run-of-show';
  if (pathname.includes('/milestones')) return 'milestones';
  return 'timeline';
}

export default function ScheduleHubTabs() {
  const router = useRouter();
  const pathname = usePathname();
  const activeTab = getActiveTab(pathname);

  return (
    <Tabs
      tabs={TABS}
      activeTab={activeTab}
      onTabChange={(key) => router.push(TAB_ROUTES[key])}
      className="mb-8"
    />
  );
}
