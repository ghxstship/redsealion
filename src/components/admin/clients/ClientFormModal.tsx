'use client';

import { useState, type FormEvent } from 'react';
import ModalShell from '@/components/ui/ModalShell';
import FormLabel from '@/components/ui/FormLabel';
import FormInput from '@/components/ui/FormInput';
import FormSelect from '@/components/ui/FormSelect';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import FormTextarea from '@/components/ui/FormTextarea';

const INDUSTRY_OPTIONS = [
  'Technology',
  'Automotive',
  'Fashion & Apparel',
  'Entertainment',
  'Food & Beverage',
  'Healthcare',
  'Finance',
  'Real Estate',
  'Retail',
  'Manufacturing',
  'Education',
  'Non-Profit',
  'Government',
  'Other',
];

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
  const [linkedin, setLinkedin] = useState('');
  const [source, setSource] = useState('');
  const [notes, setNotes] = useState('');
  const [showMore, setShowMore] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resetForm() {
    setCompanyName(''); setIndustry(''); setContactFirstName('');
    setContactLastName(''); setContactEmail(''); setWebsite('');
    setLinkedin(''); setSource(''); setNotes('');
    setShowMore(false); setError(null);
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
          linkedin: linkedin || undefined,
          source: source || undefined,
          notes: notes || undefined,
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
    <ModalShell open={open} onClose={onClose} title="New Client" size="lg">
      {error && <Alert className="mb-4">{error}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <FormLabel>Company Name *</FormLabel>
          <FormInput type="text" required value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="e.g. Acme Corp" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <FormLabel>Industry</FormLabel>
            <FormSelect value={industry} onChange={(e) => setIndustry(e.target.value)}>
              <option value="">Select industry...</option>
              {INDUSTRY_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </FormSelect>
          </div>

          <div>
            <FormLabel>Source</FormLabel>
            <FormInput type="text" value={source} onChange={(e) => setSource(e.target.value)} placeholder="e.g. Referral, Conference" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <FormLabel>Website</FormLabel>
            <FormInput type="url" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://example.com" />
          </div>

          <div>
            <FormLabel>LinkedIn</FormLabel>
            <FormInput type="url" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="https://linkedin.com/company/..." />
          </div>
        </div>

        {/* Collapsible additional details */}
        {!showMore && (
          <button type="button" onClick={() => setShowMore(true)} className="text-sm text-text-muted hover:text-foreground transition-colors">
            + Additional details (notes)
          </button>
        )}

        {showMore && (
          <div>
            <FormLabel>Notes</FormLabel>
            <FormTextarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-text-muted focus:border-foreground/30 focus:outline-none focus:ring-1 focus:ring-foreground/10 resize-none"
              placeholder="Internal notes about this client..."
            />
          </div>
        )}

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
