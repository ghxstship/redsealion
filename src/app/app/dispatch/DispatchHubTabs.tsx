'use client';

import { useRouter, usePathname } from 'next/navigation';
import Tabs from '@/components/ui/Tabs';

type DispatchTab = 'overview' | 'board' | 'routes' | 'history';

const TABS: Array<{ key: DispatchTab; label: string }> = [
  { key: 'overview', label: 'Overview' },
  { key: 'board', label: 'Board' },
  { key: 'routes', label: 'Routes' },
  { key: 'history', label: 'History' },
];

const TAB_ROUTES: Record<DispatchTab, string> = {
  overview: '/app/dispatch',
  board: '/app/dispatch/board',
  routes: '/app/dispatch/routes',
  history: '/app/dispatch/history',
};

function getActiveTab(pathname: string): DispatchTab {
  if (pathname.includes('/board')) return 'board';
  if (pathname.includes('/routes')) return 'routes';
  if (pathname.includes('/history')) return 'history';
  return 'overview';
}

export default function DispatchHubTabs() {
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
