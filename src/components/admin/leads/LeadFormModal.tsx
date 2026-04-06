'use client';

import { useState, type FormEvent } from 'react';
import ModalShell from '@/components/ui/ModalShell';
import FormLabel from '@/components/ui/FormLabel';
import FormSelect from '@/components/ui/FormSelect';
import FormTextarea from '@/components/ui/FormTextarea';
import FormInput from '@/components/ui/FormInput';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

interface LeadFormModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const SOURCES = ['Website', 'Referral', 'LinkedIn', 'Cold Outreach', 'Lead Form', 'Event', 'Other'] as const;

export default function LeadFormModal({ open, onClose, onCreated }: LeadFormModalProps) {
  const [contactFirstName, setContactFirstName] = useState('');
  const [contactLastName, setContactLastName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [source, setSource] = useState('');
  const [estimatedBudget, setEstimatedBudget] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resetForm() {
    setContactFirstName(''); setContactLastName(''); setContactEmail('');
    setCompanyName(''); setContactPhone(''); setSource('');
    setEstimatedBudget(''); setMessage(''); setError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact_name: [contactFirstName, contactLastName].filter(Boolean).join(' '),
          contact_email: contactEmail || undefined,
          company_name: companyName || undefined,
          contact_phone: contactPhone || undefined,
          source: source || undefined,
          estimated_budget: estimatedBudget ? parseFloat(estimatedBudget) : undefined,
          message: message || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to create lead');
      }

      resetForm();
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ModalShell open={open} onClose={onClose} title="New Lead">
      {error && <Alert className="mb-4">{error}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <FormLabel>First Name</FormLabel>
            <FormInput type="text" required value={contactFirstName} onChange={(e) => setContactFirstName(e.target.value)} placeholder="e.g. Rachel" />
          </div>
          <div>
            <FormLabel>Last Name</FormLabel>
            <FormInput type="text" value={contactLastName} onChange={(e) => setContactLastName(e.target.value)} placeholder="e.g. Kim" />
          </div>
          <div>
            <FormLabel>Email</FormLabel>
            <FormInput type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="rachel@example.com" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <FormLabel>Company</FormLabel>
            <FormInput type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="e.g. Nike, Google" />
          </div>
          <div>
            <FormLabel>Phone</FormLabel>
            <FormInput type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="+1 555 000 0000" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <FormLabel>Source</FormLabel>
            <FormSelect value={source} onChange={(e) => setSource(e.target.value)}>
              <option value="">Select source...</option>
              {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
            </FormSelect>
          </div>
          <div>
            <FormLabel>Est. Budget</FormLabel>
            <FormInput type="number" min={0} step="1000" value={estimatedBudget} onChange={(e) => setEstimatedBudget(e.target.value)} placeholder="50000" />
          </div>
        </div>

        <div>
          <FormLabel>Notes</FormLabel>
          <FormTextarea value={message} onChange={(e) => setMessage(e.target.value)} rows={2}
            placeholder="Any additional context..." />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={submitting}>
            {submitting ? 'Creating...' : 'Create Lead'}
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}
