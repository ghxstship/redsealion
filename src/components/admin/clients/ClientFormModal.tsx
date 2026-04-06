'use client';

import { useState, type FormEvent } from 'react';
import ModalShell from '@/components/ui/ModalShell';
import FormLabel from '@/components/ui/FormLabel';
import FormInput from '@/components/ui/FormInput';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

interface ClientFormModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function ClientFormModal({ open, onClose, onCreated }: ClientFormModalProps) {
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [contactFirstName, setContactFirstName] = useState('');
  const [contactLastName, setContactLastName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resetForm() {
    setCompanyName(''); setIndustry(''); setContactFirstName('');
    setContactLastName(''); setContactEmail(''); setWebsite(''); setError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const contacts =
        contactFirstName && contactEmail
          ? [{ first_name: contactFirstName, last_name: contactLastName || '', email: contactEmail, role: 'primary' }]
          : [];

      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: companyName,
          industry: industry || undefined,
          website: website || undefined,
          contacts,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to create client');
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
    <ModalShell open={open} onClose={onClose} title="New Client">
      {error && <Alert className="mb-4">{error}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <FormLabel>Company Name</FormLabel>
          <FormInput type="text" required value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="e.g. Acme Corp" />
        </div>

        <div>
          <FormLabel>Industry</FormLabel>
          <FormInput type="text" value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="e.g. Technology, Automotive, Fashion" />
        </div>

        <div>
          <FormLabel>Website</FormLabel>
          <FormInput type="url" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://example.com" />
        </div>

        <div className="border-t border-border pt-4">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted mb-3">Primary Contact</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FormLabel>First Name</FormLabel>
              <FormInput type="text" value={contactFirstName} onChange={(e) => setContactFirstName(e.target.value)} placeholder="Jane" />
            </div>
            <div>
              <FormLabel>Last Name</FormLabel>
              <FormInput type="text" value={contactLastName} onChange={(e) => setContactLastName(e.target.value)} placeholder="Doe" />
            </div>
          </div>
          <div className="mt-4">
            <FormLabel>Email</FormLabel>
            <FormInput type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="jane@example.com" />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={submitting}>
            {submitting ? 'Creating...' : 'Create Client'}
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}
