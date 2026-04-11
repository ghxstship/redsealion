'use client';
import HubTabs from '@/components/shared/HubTabs';

export default function DispatchHubTabs() {
  return (
    <HubTabs
      basePath="/app/dispatch"
      tabs={[
        { key: '', label: 'Overview' },
        { key: 'board', label: 'Board' },
        { key: 'routes', label: 'Routes' },
        { key: 'history', label: 'History' }
      ]}
    />
  );
}
