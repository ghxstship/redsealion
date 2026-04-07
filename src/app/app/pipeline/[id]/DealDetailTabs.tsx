'use client';

import { useState, type ReactNode } from 'react';
import Tabs from '@/components/ui/Tabs';

type DealTabKey = 'details' | 'activity' | 'ai';

const TABS: Array<{ key: DealTabKey; label: string }> = [
  { key: 'details', label: 'Details' },
  { key: 'activity', label: 'Activity' },
  { key: 'ai', label: 'Risk & AI' },
];

interface DealDetailTabsProps {
  activityCount: number;
  detailsContent: ReactNode;
  activityContent: ReactNode;
  aiContent: ReactNode;
}

export default function DealDetailTabs({
  activityCount,
  detailsContent,
  activityContent,
  aiContent,
}: DealDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<DealTabKey>('details');

  const tabsWithCounts = TABS.map((tab) => ({
    ...tab,
    count: tab.key === 'activity' ? activityCount : undefined,
  }));

  return (
    <>
      <Tabs tabs={tabsWithCounts} activeTab={activeTab} onTabChange={setActiveTab} className="mb-6" />
      {activeTab === 'details' && detailsContent}
      {activeTab === 'activity' && activityContent}
      {activeTab === 'ai' && aiContent}
    </>
  );
}
