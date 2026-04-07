'use client';

import { useRouter, usePathname } from 'next/navigation';
import Tabs from '@/components/ui/Tabs';

type LeadsTab = 'inbox' | 'forms';

const TABS: Array<{ key: LeadsTab; label: string }> = [
  { key: 'inbox', label: 'Inbox' },
  { key: 'forms', label: 'Lead Forms' },
];

const TAB_ROUTES: Record<LeadsTab, string> = {
  inbox: '/app/leads',
  forms: '/app/leads/forms',
};

function getActiveTab(pathname: string): LeadsTab {
  if (pathname.includes('/forms')) return 'forms';
  return 'inbox';
}

export default function LeadsHubTabs() {
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
