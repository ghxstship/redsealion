'use client';

import { useRouter, usePathname } from 'next/navigation';
import Tabs from '@/components/ui/Tabs';

type ReportsTab = 'overview' | 'pipeline' | 'forecast' | 'funnel' | 'win-rate' | 'revenue' | 'wip' | 'utilization' | 'builder';

const TABS: Array<{ key: ReportsTab; label: string }> = [
  { key: 'overview', label: 'Overview' },
  { key: 'pipeline', label: 'Pipeline' },
  { key: 'forecast', label: 'Forecast' },
  { key: 'funnel', label: 'Funnel' },
  { key: 'win-rate', label: 'Win Rate' },
  { key: 'revenue', label: 'Revenue' },
  { key: 'wip', label: 'WIP' },
  { key: 'utilization', label: 'Utilization' },
  { key: 'builder', label: 'Builder' },
];

const TAB_ROUTES: Record<ReportsTab, string> = {
  overview: '/app/reports',
  pipeline: '/app/reports/pipeline',
  forecast: '/app/reports/forecast',
  funnel: '/app/reports/funnel',
  'win-rate': '/app/reports/win-rate',
  revenue: '/app/reports/revenue',
  wip: '/app/reports/wip',
  utilization: '/app/reports/utilization',
  builder: '/app/reports/builder',
};

function getActiveTab(pathname: string): ReportsTab {
  if (pathname.includes('/pipeline')) return 'pipeline';
  if (pathname.includes('/forecast')) return 'forecast';
  if (pathname.includes('/funnel')) return 'funnel';
  if (pathname.includes('/win-rate')) return 'win-rate';
  if (pathname.includes('/revenue')) return 'revenue';
  if (pathname.includes('/wip')) return 'wip';
  if (pathname.includes('/utilization')) return 'utilization';
  if (pathname.includes('/builder')) return 'builder';
  return 'overview';
}

export default function ReportsHubTabs() {
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
