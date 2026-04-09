'use client';

import { useState, type FormEvent } from 'react';
import ModalShell from '@/components/ui/ModalShell';
import FormLabel from '@/components/ui/FormLabel';
import FormSelect from '@/components/ui/FormSelect';
import FormTextarea from '@/components/ui/FormTextarea';
import FormInput from '@/components/ui/FormInput';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import { PORTFOLIO_CATEGORIES } from '@/components/admin/portfolio/PortfolioGrid';

interface PortfolioFormModalProps { open: boolean; onClose: () => void; onCreated: () => void; }

export default function PortfolioFormModal({ open, onClose, onCreated }: PortfolioFormModalProps) {
  const [projectName, setProjectName] = useState('');
  const [clientName, setClientName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [projectYear, setProjectYear] = useState(String(new Date().getFullYear()));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resetForm() { setProjectName(''); setClientName(''); setCategory(''); setDescription(''); setProjectYear(String(new Date().getFullYear())); setError(null); }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_name: projectName, client_name: clientName || undefined,
          category, description: description || undefined,
          project_year: parseInt(projectYear) || new Date().getFullYear(),
        }),
      });
      if (!res.ok) { const data = await res.json().catch(() => ({})); throw new Error(data.error || 'Failed to add project'); }
      resetForm(); onCreated(); onClose();
    } catch (err) { setError(err instanceof Error ? err.message : 'An error occurred'); }
    finally { setSubmitting(false); }
  }

  return (
    <ModalShell open={open} onClose={onClose} title="Add Portfolio Project">
      {error && <Alert className="mb-4">{error}</Alert>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <FormLabel>Project Name</FormLabel>
            <FormInput type="text" required value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="e.g. Nike Air Max Launch" />
          </div>
          <div>
            <FormLabel>Client</FormLabel>
            <FormInput type="text" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="e.g. Nike" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <FormLabel>Category</FormLabel>
            <FormSelect required value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">Select...</option>
              {PORTFOLIO_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </FormSelect>
          </div>
          <div>
            <FormLabel>Year</FormLabel>
            <FormInput type="number" value={projectYear} onChange={(e) => setProjectYear(e.target.value)} min={2000} max={2100} />
          </div>
        </div>
        <div>
          <FormLabel>Description</FormLabel>
          <FormTextarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Brief project description..." />
        </div>
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={submitting}>{submitting ? 'Adding...' : 'Add Project'}</Button>
        </div>
      </form>
    </ModalShell>
  );
}
