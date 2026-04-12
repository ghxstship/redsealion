import FormInput from '@/components/ui/FormInput';
'use client';

import { useState } from 'react';
import { createKeyResult } from './actions';
import ModalShell from '@/components/ui/ModalShell';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

interface KeyResultFormProps {
  goalId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function KeyResultForm({ goalId, isOpen, onClose }: KeyResultFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    
    if (!title) {
        setError('Title is required');
        setIsSubmitting(false);
        return;
    }
    setError(null);

    try {
      await createKeyResult(goalId, formData);
      onClose();
    } catch (err) {
      console.error(err);
      setError('Failed to save key result');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ModalShell open={isOpen} onClose={onClose} title="Add Key Result">
      <form onSubmit={handleSubmit} className="space-y-4 pt-4">
        {error && (
          <Alert variant="error">
            {error}
          </Alert>
        )}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-foreground">
            Title
          </label>
          <FormInput
            type="text"
            name="title"
            id="title"
            required
            className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="e.g., Increase retention from 70% to 90%"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label htmlFor="start_value" className="block text-sm font-medium text-foreground">
              Start Value
            </label>
            <FormInput
              type="number"
              step="any"
              name="start_value"
              id="start_value"
              required
              defaultValue={0}
              className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="target" className="block text-sm font-medium text-foreground">
              Target Value
            </label>
            <FormInput
              type="number"
              step="any"
              name="target"
              id="target"
              required
              className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="unit" className="block text-sm font-medium text-foreground">
              Unit
            </label>
            <FormInput
              type="text"
              name="unit"
              id="unit"
              required
              className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="e.g., %, $k, users"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Add Key Result'}
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}
