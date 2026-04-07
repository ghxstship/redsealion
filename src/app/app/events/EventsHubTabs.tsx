'use client';

import { useRouter, usePathname } from 'next/navigation';
import Tabs from '@/components/ui/Tabs';

type EventsTab = 'events' | 'calendar' | 'activations' | 'locations' | 'daily-reports' | 'punch-list';

const TABS: Array<{ key: EventsTab; label: string }> = [
  { key: 'events', label: 'Events' },
  { key: 'calendar', label: 'Calendar' },
  { key: 'activations', label: 'Activations' },
  { key: 'locations', label: 'Locations' },
  { key: 'daily-reports', label: 'Daily Reports' },
  { key: 'punch-list', label: 'Punch List' },
];

const TAB_ROUTES: Record<EventsTab, string> = {
  events: '/app/events',
  calendar: '/app/events/calendar',
  activations: '/app/events/activations',
  locations: '/app/events/locations',
  'daily-reports': '/app/events/daily-reports',
  'punch-list': '/app/events/punch-list',
};

function getActiveTab(pathname: string): EventsTab {
  if (pathname.includes('/calendar')) return 'calendar';
  if (pathname.includes('/activations')) return 'activations';
  if (pathname.includes('/locations')) return 'locations';
  if (pathname.includes('/daily-reports')) return 'daily-reports';
  if (pathname.includes('/punch-list')) return 'punch-list';
  return 'events';
}

export default function EventsHubTabs() {
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
