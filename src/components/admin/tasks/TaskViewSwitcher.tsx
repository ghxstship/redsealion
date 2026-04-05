'use client';

import { useRouter, usePathname } from 'next/navigation';
import ViewTypeSwitcher from '@/components/shared/ViewTypeSwitcher';

const TASK_VIEWS = [
  { key: 'table', label: 'Table', icon: '⊞' },
  { key: 'board', label: 'Board', icon: '◫' },
  { key: 'gantt', label: 'Gantt', icon: '▤' },
  { key: 'calendar', label: 'Calendar', icon: '📅' },
];

const VIEW_ROUTES: Record<string, string> = {
  table: '/app/tasks',
  board: '/app/tasks/board',
  gantt: '/app/tasks/gantt',
  calendar: '/app/tasks/calendar',
};

export default function TaskViewSwitcher() {
  const router = useRouter();
  const pathname = usePathname();

  function getActiveView(): string {
    if (pathname.endsWith('/board')) return 'board';
    if (pathname.endsWith('/gantt')) return 'gantt';
    if (pathname.endsWith('/calendar')) return 'calendar';
    return 'table';
  }

  function handleSwitch(key: string) {
    const route = VIEW_ROUTES[key] ?? '/app/tasks';
    router.push(route);
  }

  return (
    <ViewTypeSwitcher
      views={TASK_VIEWS}
      activeView={getActiveView()}
      onSwitch={handleSwitch}
    />
  );
}
