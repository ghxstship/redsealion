'use client';

import { useRouter, usePathname } from 'next/navigation';
import Tabs from '@/components/ui/Tabs';

type CrewTab = 'directory' | 'availability' | 'schedule' | 'onboarding' | 'recruitment';

const TABS: Array<{ key: CrewTab; label: string }> = [
  { key: 'directory', label: 'Directory' },
  { key: 'availability', label: 'Availability' },
  { key: 'schedule', label: 'Schedule' },
  { key: 'onboarding', label: 'Onboarding' },
  { key: 'recruitment', label: 'Recruitment' },
];

const TAB_ROUTES: Record<CrewTab, string> = {
  directory: '/app/crew',
  availability: '/app/crew/availability',
  schedule: '/app/crew/schedule',
  onboarding: '/app/crew/onboarding',
  recruitment: '/app/crew/recruitment',
};

function getActiveTab(pathname: string): CrewTab {
  if (pathname.includes('/availability')) return 'availability';
  if (pathname.includes('/schedule')) return 'schedule';
  if (pathname.includes('/onboarding')) return 'onboarding';
  if (pathname.includes('/recruitment')) return 'recruitment';
  return 'directory';
}

export default function CrewHubTabs() {
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
