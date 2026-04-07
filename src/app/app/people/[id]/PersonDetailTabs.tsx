'use client';

import { useState, type ReactNode } from 'react';
import Tabs from '@/components/ui/Tabs';

type PersonTab = 'profile' | 'activity' | 'permissions';

const TABS: Array<{ key: PersonTab; label: string }> = [
  { key: 'profile', label: 'Profile' },
  { key: 'activity', label: 'Activity' },
  { key: 'permissions', label: 'Permissions' },
];

interface PersonDetailTabsProps {
  profileContent: ReactNode;
  activityContent: ReactNode;
  permissionsContent: ReactNode;
}

export default function PersonDetailTabs({
  profileContent,
  activityContent,
  permissionsContent,
}: PersonDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<PersonTab>('profile');

  return (
    <>
      <Tabs tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} className="mb-6" />
      {activeTab === 'profile' && profileContent}
      {activeTab === 'activity' && activityContent}
      {activeTab === 'permissions' && permissionsContent}
    </>
  );
}
