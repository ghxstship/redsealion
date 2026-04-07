'use client';

import { useRouter, usePathname } from 'next/navigation';
import ViewTypeSwitcher from '@/components/shared/ViewTypeSwitcher';
import { LayoutList, CalendarClock, BarChart3 } from 'lucide-react';

const PERSIST_KEY = 'flytedeck:view:workloads';

const WORKLOAD_VIEWS = [
  { key: 'overview', label: 'Overview', icon: <LayoutList size={13} /> },
  { key: 'schedule', label: 'Schedule', icon: <CalendarClock size={13} /> },
  { key: 'utilization', label: 'Utilization', icon: <BarChart3 size={13} /> },
];

const VIEW_ROUTES: Record<string, string> = {
  overview: '/app/workloads',
  schedule: '/app/workloads/schedule',
  utilization: '/app/workloads/utilization',
};

export default function WorkloadViewSwitcher() {
  const router = useRouter();
  const pathname = usePathname();

  function getActiveView(): string {
    if (pathname.endsWith('/schedule')) return 'schedule';
    if (pathname.endsWith('/utilization')) return 'utilization';
    return 'overview';
  }

  function handleSwitch(key: string) {
    const route = VIEW_ROUTES[key] ?? '/app/workloads';
    router.push(route);
  }

  return (
    <ViewTypeSwitcher
      views={WORKLOAD_VIEWS}
      activeView={getActiveView()}
      onSwitch={handleSwitch}
      persistKey={PERSIST_KEY}
    />
  );
}
