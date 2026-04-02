import { TierGate } from '@/components/shared/TierGate';
import TimerWidget from '@/components/admin/time/TimerWidget';

export default function TimerPage() {
  return (
    <TierGate feature="time_tracking">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Timer
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Start and stop a running timer to track your work.
        </p>
      </div>

      <TimerWidget />
    </TierGate>
  );
}
