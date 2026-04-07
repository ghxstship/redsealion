'use client';

import { useRouter, usePathname } from 'next/navigation';
import ViewTypeSwitcher from '@/components/shared/ViewTypeSwitcher';
import { LayoutList, CalendarClock, BarChart3 } from 'lucide-react';

const PERSIST_KEY = 'flytedeck:view:resources';

const RESOURCE_VIEWS = [
  { key: 'overview', label: 'Overview', icon: <LayoutList size={13} /> },
  { key: 'schedule', label: 'Schedule', icon: <CalendarClock size={13} /> },
  { key: 'capacity', label: 'Capacity', icon: <BarChart3 size={13} /> },
];

const VIEW_ROUTES: Record<string, string> = {
  overview: '/app/resources',
  schedule: '/app/resources/schedule',
  capacity: '/app/resources/capacity',
};

export default function ResourceViewSwitcher() {
  const router = useRouter();
  const pathname = usePathname();

  function getActiveView(): string {
    if (pathname.endsWith('/schedule')) return 'schedule';
    if (pathname.endsWith('/capacity')) return 'capacity';
    return 'overview';
  }

  function handleSwitch(key: string) {
    const route = VIEW_ROUTES[key] ?? '/app/resources';
    router.push(route);
  }

  return (
    <ViewTypeSwitcher
      views={RESOURCE_VIEWS}
      activeView={getActiveView()}
      onSwitch={handleSwitch}
      persistKey={PERSIST_KEY}
    />
  );
}
