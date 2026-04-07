'use client';

import { useRouter, usePathname } from 'next/navigation';
import Tabs from '@/components/ui/Tabs';

type PeopleTab = 'directory' | 'org-chart' | 'time-off';

const TABS: Array<{ key: PeopleTab; label: string }> = [
  { key: 'directory', label: 'Directory' },
  { key: 'org-chart', label: 'Org Chart' },
  { key: 'time-off', label: 'Time Off' },
];

const TAB_ROUTES: Record<PeopleTab, string> = {
  directory: '/app/people',
  'org-chart': '/app/people/org-chart',
  'time-off': '/app/people/time-off',
};

function getActiveTab(pathname: string): PeopleTab {
  if (pathname.includes('/org-chart')) return 'org-chart';
  if (pathname.includes('/time-off')) return 'time-off';
  return 'directory';
}

export default function PeopleHubTabs() {
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
