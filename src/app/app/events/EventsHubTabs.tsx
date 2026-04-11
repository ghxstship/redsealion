'use client';
import HubTabs from '@/components/shared/HubTabs';

export default function EventsHubTabs() {
  return (
    <HubTabs
      basePath="/app/events"
      tabs={[
        { key: '', label: 'Events' },
        { key: 'calendar', label: 'Calendar' },
        { key: 'activations', label: 'Activations' },
        { key: 'locations', label: 'Locations' },
        { key: 'daily-reports', label: 'Daily Reports' },
        { key: 'punch-list', label: 'Punch List' }
      ]}
    />
  );
}
