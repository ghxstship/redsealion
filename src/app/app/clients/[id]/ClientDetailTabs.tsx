'use client';

import { useState, type ReactNode } from 'react';
import Tabs from '@/components/ui/Tabs';

type TabKey = 'overview' | 'contacts' | 'proposals' | 'interactions' | 'activity';

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: 'overview', label: 'Overview' },
  { key: 'contacts', label: 'Contacts' },
  { key: 'proposals', label: 'Proposals & Deals' },
  { key: 'interactions', label: 'Interactions' },
  { key: 'activity', label: 'Activity' },
];

interface ClientDetailTabsProps {
  contactCount: number;
  proposalCount: number;
  dealCount: number;
  interactionCount: number;
  activityCount: number;
  overviewContent: ReactNode;
  contactsContent: ReactNode;
  proposalsContent: ReactNode;
  interactionsContent: ReactNode;
  activityContent: ReactNode;
}

export default function ClientDetailTabs({
  contactCount,
  proposalCount,
  dealCount,
  interactionCount,
  activityCount,
  overviewContent,
  contactsContent,
  proposalsContent,
  interactionsContent,
  activityContent,
}: ClientDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  const tabsWithCounts = TABS.map((tab) => {
    let count: number | undefined;
    if (tab.key === 'contacts') count = contactCount;
    if (tab.key === 'proposals') count = proposalCount + dealCount;
    if (tab.key === 'interactions') count = interactionCount;
    if (tab.key === 'activity') count = activityCount;
    return { ...tab, count };
  });

  return (
    <>
      <Tabs tabs={tabsWithCounts} activeTab={activeTab} onTabChange={setActiveTab} className="mb-8" />

      {activeTab === 'overview' && overviewContent}
      {activeTab === 'contacts' && contactsContent}
      {activeTab === 'proposals' && proposalsContent}
      {activeTab === 'interactions' && interactionsContent}
      {activeTab === 'activity' && activityContent}
    </>
  );
}
