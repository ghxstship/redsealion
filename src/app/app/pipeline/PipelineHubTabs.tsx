'use client';

import { useRouter, usePathname } from 'next/navigation';
import Tabs from '@/components/ui/Tabs';

type PipelineTab = 'board' | 'list' | 'forecast' | 'territories' | 'commissions' | 'settings';

const TABS: Array<{ key: PipelineTab; label: string }> = [
  { key: 'board', label: 'Board' },
  { key: 'list', label: 'List' },
  { key: 'forecast', label: 'Forecast' },
  { key: 'territories', label: 'Territories' },
  { key: 'commissions', label: 'Commissions' },
  { key: 'settings', label: 'Settings' },
];

const TAB_ROUTES: Record<PipelineTab, string> = {
  board: '/app/pipeline',
  list: '/app/pipeline/list',
  forecast: '/app/pipeline/forecast',
  territories: '/app/pipeline/territories',
  commissions: '/app/pipeline/commissions',
  settings: '/app/pipeline/settings',
};

function getActiveTab(pathname: string): PipelineTab {
  if (pathname.includes('/list')) return 'list';
  if (pathname.includes('/forecast')) return 'forecast';
  if (pathname.includes('/territories')) return 'territories';
  if (pathname.includes('/commissions')) return 'commissions';
  if (pathname.includes('/settings')) return 'settings';
  return 'board';
}

export default function PipelineHubTabs() {
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
