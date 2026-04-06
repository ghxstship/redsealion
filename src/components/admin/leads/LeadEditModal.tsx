'use client';

import { useState, type FormEvent } from 'react';
import ModalShell from '@/components/ui/ModalShell';
import FormLabel from '@/components/ui/FormLabel';
import FormInput from '@/components/ui/FormInput';
import FormSelect from '@/components/ui/FormSelect';
import FormTextarea from '@/components/ui/FormTextarea';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

interface Lead {
  id: string;
  contact_first_name: string;
  contact_last_name: string;
  contact_email: string;
  contact_phone: string | null;
  company_name: string | null;
  source: string | null;
  status: string;
  estimated_budget: number | null;
  message: string | null;
}

interface LeadEditModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  lead: Lead;
}

const STATUS_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'converted', label: 'Converted' },
  { value: 'lost', label: 'Lost' },
];

export default function LeadEditModal({ open, onClose, onSaved, lead }: LeadEditModalProps) {
  const [firstName, setFirstName] = useState(lead.contact_first_name);
  const [lastName, setLastName] = useState(lead.contact_last_name);
  const [email, setEmail] = useState(lead.contact_email);
  const [phone, setPhone] = useState(lead.contact_phone ?? '');
  const [company, setCompany] = useState(lead.company_name ?? '');
  const [source, setSource] = useState(lead.source ?? '');
  const [status, setStatus] = useState(lead.status);
  const [budget, setBudget] = useState(lead.estimated_budget?.toString() ?? '');
  const [message, setMessage] = useState(lead.message ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact_first_name: firstName,
          contact_last_name: lastName,
          contact_email: email,
          contact_phone: phone || null,
          company_name: company || null,
          source: source || null,
          status,
          estimated_budget: budget ? parseFloat(budget) : null,
          message: message || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to update lead');
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ModalShell open={open} onClose={onClose} title="Edit Lead">
      {error && <Alert className="mb-4">{error}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <FormLabel>First Name *</FormLabel>
            <FormInput type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </div>
          <div>
            <FormLabel>Last Name</FormLabel>
            <FormInput type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
        </div>

        <div>
          <FormLabel>Email *</FormLabel>
          <FormInput type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <FormLabel>Company</FormLabel>
            <FormInput type="text" value={company} onChange={(e) => setCompany(e.target.value)} />
          </div>
          <div>
            <FormLabel>Phone</FormLabel>
            <FormInput type="text" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <FormLabel>Status</FormLabel>
            <FormSelect value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </FormSelect>
          </div>
          <div>
            <FormLabel>Budget</FormLabel>
            <FormInput type="number" step="0.01" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="e.g. 50000" />
          </div>
        </div>

        <div>
          <FormLabel>Source</FormLabel>
          <FormInput type="text" value={source} onChange={(e) => setSource(e.target.value)} placeholder="e.g. Website, Referral" />
        </div>

        <div>
          <FormLabel>Notes</FormLabel>
          <FormTextarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={submitting}>
            {submitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}
