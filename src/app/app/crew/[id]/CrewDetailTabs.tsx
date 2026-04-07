'use client';

import { useState, type ReactNode } from 'react';
import Tabs from '@/components/ui/Tabs';

type CrewTab = 'profile' | 'bookings' | 'compliance';

const TABS: Array<{ key: CrewTab; label: string }> = [
  { key: 'profile', label: 'Profile' },
  { key: 'bookings', label: 'Bookings' },
  { key: 'compliance', label: 'Compliance & Ratings' },
];

interface CrewDetailTabsProps {
  bookingCount: number;
  profileContent: ReactNode;
  bookingsContent: ReactNode;
  complianceContent: ReactNode;
}

export default function CrewDetailTabs({
  bookingCount,
  profileContent,
  bookingsContent,
  complianceContent,
}: CrewDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<CrewTab>('profile');

  const tabsWithCounts = TABS.map((tab) => ({
    ...tab,
    count: tab.key === 'bookings' ? bookingCount : undefined,
  }));

  return (
    <>
      <Tabs tabs={tabsWithCounts} activeTab={activeTab} onTabChange={setActiveTab} className="mb-6" />
      {activeTab === 'profile' && profileContent}
      {activeTab === 'bookings' && bookingsContent}
      {activeTab === 'compliance' && complianceContent}
    </>
  );
}
