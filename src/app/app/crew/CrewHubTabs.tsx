'use client';
import HubTabs from '@/components/shared/HubTabs';

export default function CrewHubTabs() {
  return (
    <HubTabs
      basePath="/app/crew"
      tabs={[
        { key: '', label: 'Directory' },
        { key: 'availability', label: 'Availability' },
        { key: 'schedule', label: 'Schedule' },
        { key: 'onboarding', label: 'Onboarding' },
        { key: 'recruitment', label: 'Recruitment' }
      ]}
    />
  );
}
