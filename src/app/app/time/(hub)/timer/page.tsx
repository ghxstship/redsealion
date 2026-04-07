import TimerWidget from '@/components/admin/time/TimerWidget';
import TimeHubTabs from '../../TimeHubTabs';
import PageHeader from '@/components/shared/PageHeader';

export default function TimerPage() {
  return (
    <>
<PageHeader
        title="Timer"
        subtitle="Start and stop a running timer to track your work."
      />

      <TimeHubTabs />

      <TimerWidget />
    </>
  );
}
