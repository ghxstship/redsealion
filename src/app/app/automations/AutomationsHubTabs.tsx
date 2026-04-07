'use client';

import { useRouter, usePathname } from 'next/navigation';
import Tabs from '@/components/ui/Tabs';

type AutomationsTab = 'workflows' | 'runs' | 'templates';

const TABS: Array<{ key: AutomationsTab; label: string }> = [
  { key: 'workflows', label: 'Workflows' },
  { key: 'runs', label: 'Runs' },
  { key: 'templates', label: 'Templates' },
];

const TAB_ROUTES: Record<AutomationsTab, string> = {
  workflows: '/app/automations',
  runs: '/app/automations/runs',
  templates: '/app/automations/templates',
};

function getActiveTab(pathname: string): AutomationsTab {
  if (pathname.includes('/runs')) return 'runs';
  if (pathname.includes('/templates')) return 'templates';
  return 'workflows';
}

export default function AutomationsHubTabs() {
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
