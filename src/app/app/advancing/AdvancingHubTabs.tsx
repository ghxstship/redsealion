'use client';

import HubTabs from '@/components/shared/HubTabs';

const TABS = [
  { key: '', label: 'Overview' },
  { key: 'submissions', label: 'Submissions' },
  { key: 'approvals', label: 'Approvals' },
  { key: 'assignments', label: 'Assignments' },
  { key: 'allocations', label: 'Allocations' },
  { key: 'fulfillment', label: 'Fulfillment' },
];

export default function AdvancingHubTabs() {
  return <HubTabs basePath="/app/advancing" tabs={TABS} />;
}
