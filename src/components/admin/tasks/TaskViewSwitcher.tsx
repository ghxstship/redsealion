'use client';

import { useRouter, usePathname } from 'next/navigation';
import ViewTypeSwitcher from '@/components/shared/ViewTypeSwitcher';
import { Table, Kanban, GanttChart, Calendar, FolderKanban, BarChart3 } from 'lucide-react';

const PERSIST_KEY = 'flytedeck:view:tasks';

const TASK_VIEWS = [
  { key: 'table', label: 'Table', icon: <Table size={13} /> },
  { key: 'board', label: 'Board', icon: <Kanban size={13} /> },
  { key: 'gantt', label: 'Gantt', icon: <GanttChart size={13} /> },
  { key: 'calendar', label: 'Calendar', icon: <Calendar size={13} /> },
  { key: 'projects', label: 'Projects', icon: <FolderKanban size={13} /> },
  { key: 'workload', label: 'Workload', icon: <BarChart3 size={13} /> },
];

const VIEW_ROUTES: Record<string, string> = {
  table: '/app/tasks',
  board: '/app/tasks/board',
  gantt: '/app/tasks/gantt',
  calendar: '/app/tasks/calendar',
  projects: '/app/tasks/projects',
  workload: '/app/tasks/workload',
};

export default function TaskViewSwitcher() {
  const router = useRouter();
  const pathname = usePathname();

  function getActiveView(): string {
    if (pathname.endsWith('/board')) return 'board';
    if (pathname.endsWith('/gantt')) return 'gantt';
    if (pathname.endsWith('/calendar')) return 'calendar';
    if (pathname.endsWith('/projects')) return 'projects';
    if (pathname.endsWith('/workload')) return 'workload';
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
      persistKey={PERSIST_KEY}
    />
  );
}
