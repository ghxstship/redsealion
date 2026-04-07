'use client';

import { useRouter, usePathname } from 'next/navigation';
import Tabs from '@/components/ui/Tabs';

type CampaignsTab = 'campaigns' | 'audiences' | 'drafts' | 'scheduled' | 'analytics';

const TABS: Array<{ key: CampaignsTab; label: string }> = [
  { key: 'campaigns', label: 'Campaigns' },
  { key: 'audiences', label: 'Audiences' },
  { key: 'drafts', label: 'Drafts' },
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'analytics', label: 'Analytics' },
];

const TAB_ROUTES: Record<CampaignsTab, string> = {
  campaigns: '/app/campaigns',
  audiences: '/app/campaigns/audiences',
  drafts: '/app/campaigns/drafts',
  scheduled: '/app/campaigns/scheduled',
  analytics: '/app/campaigns/analytics',
};

function getActiveTab(pathname: string): CampaignsTab {
  if (pathname.includes('/audiences')) return 'audiences';
  if (pathname.includes('/drafts')) return 'drafts';
  if (pathname.includes('/scheduled')) return 'scheduled';
  if (pathname.includes('/analytics')) return 'analytics';
  return 'campaigns';
}

export default function CampaignsHubTabs() {
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
