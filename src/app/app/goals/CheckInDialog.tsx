'use client';

import FormInput from '@/components/ui/FormInput';

import { useState } from 'react';
import { createCheckIn } from './actions';
import { GOAL_STATUSES } from './constants';
import ModalShell from '@/components/ui/ModalShell';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import FormSelect from '@/components/ui/FormSelect';
import FormTextarea from '@/components/ui/FormTextarea';

interface GoalRef {
  id: string;
  title: string;
  progress: number;
}

interface CheckInDialogProps {
  goal: GoalRef;
  isOpen: boolean;
  onClose: () => void;
}

export default function CheckInDialog({ goal, isOpen, onClose }: CheckInDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    formData.append('previous_progress', goal.progress.toString());

    try {
      setError(null);
      await createCheckIn(goal.id, formData);
      onClose();
    } catch (err) {
      console.error(err);
      setError('Failed to submit check-in');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ModalShell open={isOpen} onClose={onClose} title="Update Progress">
      <form onSubmit={handleSubmit} className="space-y-4 pt-4">
        {error && (
          <Alert variant="error">
            {error}
          </Alert>
        )}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
             Goal: {goal.title}
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-muted">
              Current Progress
            </label>
            <div className="mt-1 py-2 text-sm">{goal.progress}%</div>
          </div>
          <div>
            <label htmlFor="new_progress" className="block text-sm font-medium text-foreground">
              New Progress (%)
            </label>
            <FormInput
              type="number"
              min="0"
              max="100"
              name="new_progress"
              id="new_progress"
              required
              defaultValue={goal.progress}
              className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium text-foreground">
            Current Status
          </label>
          <FormSelect
            name="status"
            id="status"
            defaultValue="on_track"
            className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
              {GOAL_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
          </FormSelect>
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-foreground">
            Check-In Notes
          </label>
          <FormTextarea
            name="notes"
            id="notes"
            rows={3}
            required
            className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="What progress was made? Are there any blockers?"
          />
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Post Check-In'}
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}
