'use client';

import { Check } from 'lucide-react';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import Alert from '@/components/ui/Alert';
import FormSelect from '@/components/ui/FormSelect';
import FormTextarea from '@/components/ui/FormTextarea';
import FormInput from '@/components/ui/FormInput';
import FormLabel from '@/components/ui/FormLabel';

const CATEGORIES = ['travel', 'meals', 'supplies', 'equipment', 'software', 'other'] as const;

export default function ExpenseForm() {
  const router = useRouter();
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          amount: parseFloat(amount),
          description: description || null,
          expense_date: date,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to create expense.');
        return;
      }

      setSubmitted(true);
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-lg rounded-xl border border-border bg-white px-8 py-16 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-50">
          <Check size={24} className="text-green-600" />
        </div>
        <p className="text-sm font-medium text-green-600">Expense submitted successfully.</p>
        <div className="mt-4 flex items-center justify-center gap-3">
          <button
            onClick={() => {
              setSubmitted(false);
              setCategory('');
              setAmount('');
              setDescription('');
              setDate(new Date().toISOString().split('T')[0]);
            }}
            className="text-sm font-medium text-foreground hover:underline"
          >
            Submit another
          </button>
          <button
            onClick={() => router.push('/app/expenses')}
            className="text-sm font-medium text-text-secondary hover:underline"
          >
            View all expenses
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-lg space-y-6">
      <div className="rounded-xl border border-border bg-white px-6 py-6 space-y-5">
        <div>
          <FormLabel>
            Category
          </FormLabel>
          <FormSelect
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
          >
            <option value="">Select category...</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </FormSelect>
        </div>

        <div>
          <FormLabel>
            Amount
          </FormLabel>
          <FormInput
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            placeholder="0.00" />
        </div>

        <div>
          <FormLabel>
            Date
          </FormLabel>
          <FormInput
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required />
        </div>

        <div>
          <FormLabel>
            Description
          </FormLabel>
          <FormTextarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Describe the expense..."
          />
        </div>
      </div>

      {error && (
        <Alert className="mb-4">{error}</Alert>
      )}

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.push('/app/expenses')}
          className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-bg-secondary"
        >
          Cancel
        </button>
        <Button type="submit"
          disabled={saving}>
          {saving ? 'Submitting...' : 'Submit Expense'}
        </Button>
      </div>
    </form>
  );
}
