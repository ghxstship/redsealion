'use client';

import HubTabs from '@/components/shared/HubTabs';

const TABS = [
  { key: '', label: 'Workflows' },
  { key: 'runs', label: 'Runs' },
  { key: 'templates', label: 'Templates' },
];

export default function AutomationsHubTabs() {
  return <HubTabs basePath="/app/automations" tabs={TABS} />;
}
