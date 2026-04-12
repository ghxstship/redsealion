'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import ModalShell from '@/components/ui/ModalShell';
import FormLabel from '@/components/ui/FormLabel';
import FormInput from '@/components/ui/FormInput';
import FormSelect from '@/components/ui/FormSelect';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import FormTextarea from '@/components/ui/FormTextarea';

interface EditClientModalProps {
  open: boolean;
  onClose: () => void;
  clientId: string;
  initialData: {
    company_name: string;
    industry: string | null;
    website: string | null;
    linkedin: string | null;
    source: string | null;
    notes: string | null;
    annual_revenue: number | null;
    employee_count: number | null;
    status?: string;
  };
}

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'churned', label: 'Churned' },
];

export default function EditClientModal({ open, onClose, clientId, initialData }: EditClientModalProps) {
  const router = useRouter();
  const [companyName, setCompanyName] = useState(initialData.company_name);
  const [industry, setIndustry] = useState(initialData.industry ?? '');
  const [website, setWebsite] = useState(initialData.website ?? '');
  const [linkedin, setLinkedin] = useState(initialData.linkedin ?? '');
  const [source, setSource] = useState(initialData.source ?? '');
  const [notes, setNotes] = useState(initialData.notes ?? '');
  const [annualRevenue, setAnnualRevenue] = useState(initialData.annual_revenue?.toString() ?? '');
  const [employeeCount, setEmployeeCount] = useState(initialData.employee_count?.toString() ?? '');
  const [status, setStatus] = useState(initialData.status ?? 'active');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/clients/${clientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: companyName,
          industry: industry || null,
          website: website || null,
          linkedin: linkedin || null,
          source: source || null,
          notes: notes || null,
          status,
          annual_revenue: annualRevenue ? parseFloat(annualRevenue) : null,
          employee_count: employeeCount ? parseInt(employeeCount, 10) : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to update client');
      }

      router.refresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ModalShell open={open} onClose={onClose} title="Edit Client" size="lg">
      {error && <Alert className="mb-4">{error}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <FormLabel>Company Name *</FormLabel>
            <FormInput type="text" required value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
          </div>

          <div>
            <FormLabel>Industry</FormLabel>
            <FormInput type="text" value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="e.g. Technology, Automotive" />
          </div>

          <div>
            <FormLabel>Status</FormLabel>
            <FormSelect value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </FormSelect>
          </div>

          <div>
            <FormLabel>Website</FormLabel>
            <FormInput type="url" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://example.com" />
          </div>

          <div>
            <FormLabel>LinkedIn</FormLabel>
            <FormInput type="url" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="https://linkedin.com/company/..." />
          </div>

          <div>
            <FormLabel>Source</FormLabel>
            <FormInput type="text" value={source} onChange={(e) => setSource(e.target.value)} placeholder="e.g. Referral, Conference, Website" />
          </div>

          <div>
            <FormLabel>Annual Revenue</FormLabel>
            <FormInput type="number" value={annualRevenue} onChange={(e) => setAnnualRevenue(e.target.value)} placeholder="0" min="0" step="1000" />
          </div>

          <div>
            <FormLabel>Employee Count</FormLabel>
            <FormInput type="number" value={employeeCount} onChange={(e) => setEmployeeCount(e.target.value)} placeholder="0" min="0" />
          </div>
        </div>

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
