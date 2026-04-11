'use client';

import HubTabs from '@/components/shared/HubTabs';

const TABS = [
  { key: '', label: 'Directory' },
  { key: 'segments', label: 'Segments' },
  { key: 'activity', label: 'Activity' },
  { key: 'map', label: 'Map' },
];

export default function ClientsHubTabs() {
  return <HubTabs basePath="/app/clients" tabs={TABS} />;
}
