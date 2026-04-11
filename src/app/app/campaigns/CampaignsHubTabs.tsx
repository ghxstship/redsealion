'use client';

import HubTabs from '@/components/shared/HubTabs';

const TABS = [
  { key: '', label: 'Campaigns' },
  { key: 'audiences', label: 'Audiences' },
  { key: 'drafts', label: 'Drafts' },
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'analytics', label: 'Analytics' },
];

export default function CampaignsHubTabs() {
  return <HubTabs basePath="/app/campaigns" tabs={TABS} />;
}
