'use client';

import { useRouter, usePathname } from 'next/navigation';
import Tabs from '@/components/ui/Tabs';

type AdvancingTab = 'overview' | 'submissions' | 'approvals' | 'assignments' | 'allocations' | 'fulfillment';

const TABS: Array<{ key: AdvancingTab; label: string }> = [
  { key: 'overview', label: 'Overview' },
  { key: 'submissions', label: 'Submissions' },
  { key: 'approvals', label: 'Approvals' },
  { key: 'assignments', label: 'Assignments' },
  { key: 'allocations', label: 'Allocations' },
  { key: 'fulfillment', label: 'Fulfillment' },
];

const TAB_ROUTES: Record<AdvancingTab, string> = {
  overview: '/app/advancing',
  submissions: '/app/advancing/submissions',
  approvals: '/app/advancing/approvals',
  assignments: '/app/advancing/assignments',
  allocations: '/app/advancing/allocations',
  fulfillment: '/app/advancing/fulfillment',
};

function getActiveTab(pathname: string): AdvancingTab {
  if (pathname.includes('/submissions')) return 'submissions';
  if (pathname.includes('/approvals')) return 'approvals';
  if (pathname.includes('/assignments')) return 'assignments';
  if (pathname.includes('/allocations')) return 'allocations';
  if (pathname.includes('/fulfillment')) return 'fulfillment';
  return 'overview';
}

export default function AdvancingHubTabs() {
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
