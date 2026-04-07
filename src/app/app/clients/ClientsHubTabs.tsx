'use client';

import { useRouter, usePathname } from 'next/navigation';
import Tabs from '@/components/ui/Tabs';

type ClientsTab = 'directory' | 'segments' | 'activity' | 'map';

const TABS: Array<{ key: ClientsTab; label: string }> = [
  { key: 'directory', label: 'Directory' },
  { key: 'segments', label: 'Segments' },
  { key: 'activity', label: 'Activity' },
  { key: 'map', label: 'Map' },
];

const TAB_ROUTES: Record<ClientsTab, string> = {
  directory: '/app/clients',
  segments: '/app/clients/segments',
  activity: '/app/clients/activity',
  map: '/app/clients/map',
};

function getActiveTab(pathname: string): ClientsTab {
  if (pathname.includes('/segments')) return 'segments';
  if (pathname.includes('/activity')) return 'activity';
  if (pathname.includes('/map')) return 'map';
  return 'directory';
}

export default function ClientsHubTabs() {
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
