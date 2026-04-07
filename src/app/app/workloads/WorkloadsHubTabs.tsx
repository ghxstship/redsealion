'use client';

import { useRouter, usePathname } from 'next/navigation';
import Tabs from '@/components/ui/Tabs';

type WorkloadsTab = 'overview' | 'schedule' | 'utilization';

const TABS: Array<{ key: WorkloadsTab; label: string }> = [
  { key: 'overview', label: 'Overview' },
  { key: 'schedule', label: 'Schedule' },
  { key: 'utilization', label: 'Utilization' },
];

const TAB_ROUTES: Record<WorkloadsTab, string> = {
  overview: '/app/workloads',
  schedule: '/app/workloads/schedule',
  utilization: '/app/workloads/utilization',
};

function getActiveTab(pathname: string): WorkloadsTab {
  if (pathname.includes('/schedule')) return 'schedule';
  if (pathname.includes('/utilization')) return 'utilization';
  return 'overview';
}

export default function WorkloadsHubTabs() {
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
