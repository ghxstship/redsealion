'use client';

import { useState } from 'react';
import { createGoal, updateGoal } from './actions';
import ModalShell from '@/components/ui/ModalShell';
import Button from '@/components/ui/Button';

interface Goal {
  id: string;
  title: string;
  description: string | null;
  status: string;
  category: string;
  due_date: string | null;
  start_date: string | null;
}

interface GoalDialogProps {
  goal?: Goal | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function GoalDialog({ goal, isOpen, onClose }: GoalDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!goal;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    
    if (!title) {
        alert('Title is required');
        setIsSubmitting(false);
        return;
    }

    try {
      if (isEditing) {
        await updateGoal(goal.id, formData);
      } else {
        await createGoal(formData);
      }
      onClose();
    } catch (err) {
      console.error(err);
      alert('Failed to save goal');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ModalShell open={isOpen} onClose={onClose} title={isEditing ? 'Edit Goal' : 'Create Goal'}>
      <form onSubmit={handleSubmit} className="space-y-4 pt-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-foreground">
            Title
          </label>
          <input
            type="text"
            name="title"
            id="title"
            required
            defaultValue={goal?.title || ''}
            className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="e.g., Increase Q3 Revenue"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-foreground">
            Description
          </label>
          <textarea
            name="description"
            id="description"
            rows={3}
            defaultValue={goal?.description || ''}
            className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Optional details or context"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-foreground">
              Category
            </label>
            <select
              name="category"
              id="category"
              defaultValue={goal?.category || 'Company'}
              className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="Company">Company</option>
              <option value="Department">Department</option>
              <option value="Individual">Individual</option>
            </select>
          </div>
          
          {isEditing && (
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-foreground">
                Status
              </label>
              <select
                name="status"
                id="status"
                defaultValue={goal?.status || 'on_track'}
                className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="on_track">On Track</option>
                <option value="at_risk">At Risk</option>
                <option value="off_track">Off Track</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="start_date" className="block text-sm font-medium text-foreground">
              Start Date
            </label>
            <input
              type="date"
              name="start_date"
              id="start_date"
              defaultValue={goal?.start_date || ''}
              className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="due_date" className="block text-sm font-medium text-foreground">
              Due Date
            </label>
            <input
              type="date"
              name="due_date"
              id="due_date"
              defaultValue={goal?.due_date || ''}
              className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Goal'}
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}
