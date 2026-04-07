'use client';

import { useRouter, usePathname } from 'next/navigation';
import Tabs from '@/components/ui/Tabs';

type TasksTab = 'list' | 'board' | 'calendar' | 'gantt' | 'projects' | 'workload';

const TABS: Array<{ key: TasksTab; label: string }> = [
  { key: 'list', label: 'List' },
  { key: 'board', label: 'Board' },
  { key: 'calendar', label: 'Calendar' },
  { key: 'gantt', label: 'Gantt' },
  { key: 'projects', label: 'Projects' },
  { key: 'workload', label: 'Workload' },
];

const TAB_ROUTES: Record<TasksTab, string> = {
  list: '/app/tasks',
  board: '/app/tasks/board',
  calendar: '/app/tasks/calendar',
  gantt: '/app/tasks/gantt',
  projects: '/app/tasks/projects',
  workload: '/app/tasks/workload',
};

function getActiveTab(pathname: string): TasksTab {
  if (pathname.includes('/board')) return 'board';
  if (pathname.includes('/calendar')) return 'calendar';
  if (pathname.includes('/gantt')) return 'gantt';
  if (pathname.includes('/projects')) return 'projects';
  if (pathname.includes('/workload')) return 'workload';
  return 'list';
}

export default function TasksHubTabs() {
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
