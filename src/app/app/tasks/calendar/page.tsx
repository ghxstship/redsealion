import { TierGate } from '@/components/shared/TierGate';
import TimeOffCalendar from '@/components/admin/people/TimeOffCalendar';

export default function TaskCalendarPage() {
  return (
    <TierGate feature="tasks">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Task Calendar</h1>
        <p className="mt-1 text-sm text-text-secondary">View tasks by due date on a calendar.</p>
      </div>

      <TimeOffCalendar />
    </TierGate>
  );
}
