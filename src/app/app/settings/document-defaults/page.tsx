'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

type DocumentType = 'proposal' | 'invoice' | 'contract' | 'sow' | 'crew_call_sheet';
type Section = 'terms_and_conditions' | 'disclaimer' | 'notes' | 'scope_header' | 'scope_footer' | 'payment_instructions';

const documentTypes: { key: DocumentType; label: string }[] = [
  { key: 'proposal', label: 'Proposal' },
  { key: 'invoice', label: 'Invoice' },
  { key: 'contract', label: 'Contract' },
  { key: 'sow', label: 'SOW' },
  { key: 'crew_call_sheet', label: 'Crew Call Sheet' },
];

const sectionsByType: Record<DocumentType, { key: Section; label: string; placeholder: string }[]> = {
  proposal: [
    { key: 'terms_and_conditions', label: 'Terms & Conditions', placeholder: 'Enter default terms and conditions for proposals...' },
    { key: 'disclaimer', label: 'Disclaimer', placeholder: 'Enter default disclaimer text for proposals...' },
    { key: 'scope_header', label: 'Scope Header', placeholder: 'Enter default scope header text...' },
    { key: 'scope_footer', label: 'Scope Footer', placeholder: 'Enter default scope footer text...' },
  ],
  invoice: [
    { key: 'payment_instructions', label: 'Payment Instructions', placeholder: 'Enter default payment instructions...' },
    { key: 'notes', label: 'Notes', placeholder: 'Enter default notes for invoices...' },
  ],
  contract: [
    { key: 'terms_and_conditions', label: 'Terms & Conditions', placeholder: 'Enter default terms and conditions for contracts...' },
    { key: 'disclaimer', label: 'Disclaimer', placeholder: 'Enter default disclaimer text for contracts...' },
  ],
  sow: [
    { key: 'scope_header', label: 'Scope Header', placeholder: 'Enter default scope header for statements of work...' },
    { key: 'scope_footer', label: 'Scope Footer', placeholder: 'Enter default scope footer for statements of work...' },
    { key: 'notes', label: 'Notes', placeholder: 'Enter default notes for statements of work...' },
  ],
  crew_call_sheet: [
    { key: 'notes', label: 'Notes', placeholder: 'Enter default notes for crew call sheets...' },
  ],
};

const fallbackContent: Record<string, string> = {
  'proposal:terms_and_conditions': 'All pricing is valid for 30 days from the date of this proposal. Changes to scope may result in adjusted pricing. A 50% deposit is required to confirm the booking.',
  'proposal:disclaimer': 'This proposal is an estimate based on the information provided. Final costs may vary depending on actual requirements and any changes to the scope of work.',
  'proposal:scope_header': 'The following services and equipment are included in this proposal:',
  'proposal:scope_footer': 'Any items or services not explicitly listed above are excluded from this proposal.',
  'invoice:payment_instructions': 'Payment is due within 30 days of the invoice date. Please reference the invoice number when making payment. Wire transfer and ACH details are provided below.',
  'invoice:notes': 'Thank you for your business. Please contact us if you have any questions regarding this invoice.',
  'contract:terms_and_conditions': 'This agreement is binding upon execution by both parties. Cancellation within 14 days of the event will incur a 50% cancellation fee. Force majeure clauses apply.',
  'contract:disclaimer': 'This contract supersedes all prior agreements and understandings. Amendments must be made in writing and signed by both parties.',
  'sow:scope_header': 'This Statement of Work outlines the deliverables, timeline, and responsibilities for the following project:',
  'sow:scope_footer': 'Deliverables not explicitly listed in this Statement of Work are considered out of scope and will require a change order.',
  'sow:notes': 'All timelines are estimates and subject to change based on client feedback and approvals.',
  'crew_call_sheet:notes': 'Please arrive at the designated call time. Wear all-black attire unless otherwise specified. Meals will be provided on site.',
};

export default function DocumentDefaultsPage() {
  const [activeType, setActiveType] = useState<DocumentType>('proposal');
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/settings/document-defaults')
      .then((res) => res.json())
      .then((data) => {
        if (data.defaults && Array.isArray(data.defaults)) {
          const loadedValues: Record<string, string> = {};
          data.defaults.forEach((d: { document_type: string; section: string; content: string }) => {
            loadedValues[`${d.document_type}:${d.section}`] = d.content;
          });
          setValues(loadedValues);
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  function handleChange(section: Section, value: string) {
    setValues((prev) => ({ ...prev, [`${activeType}:${section}`]: value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const sections = sectionsByType[activeType];
      await Promise.all(
        sections.map((s) =>
          fetch('/api/settings/document-defaults', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              document_type: activeType,
              section: s.key,
              content: values[`${activeType}:${s.key}`] || '',
            }),
          })
        )
      );
    } finally {
      setSaving(false);
    }
  }

  const sections = sectionsByType[activeType];

  if (!loaded) return null;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Document Defaults</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Set default text for proposals, invoices, and contracts.
        </p>
      </div>

      {/* Document type tabs */}
      <div className="flex gap-1 rounded-lg bg-bg-secondary p-1">
        {documentTypes.map((dt) => (
          <button
            key={dt.key}
            onClick={() => setActiveType(dt.key)}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              activeType === dt.key
                ? 'bg-white text-foreground shadow-sm'
                : 'text-text-secondary hover:text-foreground'
            }`}
          >
            {dt.label}
          </button>
        ))}
      </div>

      {/* Section textareas */}
      {sections.map((s) => (
        <Card key={s.key}>
          <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
            {s.label}
          </label>
          <textarea
            rows={4}
            value={values[`${activeType}:${s.key}`] || ''}
            onChange={(e) => handleChange(s.key, e.target.value)}
            placeholder={s.placeholder}
            className="w-full rounded-lg border border-border bg-white px-3.5 py-2 text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20 resize-y"
          />
        </Card>
      ))}

      {/* Save */}
      <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
      </div>
    </div>
  );
}
