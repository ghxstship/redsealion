'use client';

import { useState, useEffect } from 'react';

interface Template {
  id?: string;
  event_type: string;
  subject_template: string;
  body_template: string;
  enabled: boolean;
}

const templateMeta: { event_type: string; title: string; description: string }[] = [
  { event_type: 'proposal_sent', title: 'Proposal Sent', description: 'When a proposal is shared with a client' },
  { event_type: 'invoice_sent', title: 'Invoice Sent', description: 'When an invoice is emailed to a client' },
  { event_type: 'signature_requested', title: 'Signature Requested', description: 'When a document needs signing' },
  { event_type: 'signature_completed', title: 'Signature Completed', description: 'After a document is signed' },
  { event_type: 'payment_received', title: 'Payment Received', description: 'Confirmation of payment' },
  { event_type: 'crew_booking_offer', title: 'Crew Booking Offer', description: 'When crew is offered a booking' },
  { event_type: 'crew_booking_confirmed', title: 'Crew Booking Confirmed', description: 'When a booking is confirmed' },
  { event_type: 'equipment_reservation_alert', title: 'Equipment Reserved', description: 'Equipment reservation notification' },
];

const variableHints: Record<string, string[]> = {
  proposal_sent: ['{{client_name}}', '{{proposal_name}}', '{{org_name}}', '{{proposal_url}}'],
  invoice_sent: ['{{client_name}}', '{{invoice_number}}', '{{amount}}', '{{due_date}}', '{{org_name}}', '{{invoice_url}}'],
  signature_requested: ['{{client_name}}', '{{document_name}}', '{{org_name}}', '{{signing_url}}'],
  signature_completed: ['{{client_name}}', '{{document_name}}', '{{org_name}}', '{{signed_date}}'],
  payment_received: ['{{client_name}}', '{{amount}}', '{{invoice_number}}', '{{org_name}}'],
  crew_booking_offer: ['{{crew_name}}', '{{event_name}}', '{{event_date}}', '{{org_name}}'],
  crew_booking_confirmed: ['{{crew_name}}', '{{event_name}}', '{{event_date}}', '{{org_name}}'],
  equipment_reservation_alert: ['{{equipment_name}}', '{{event_name}}', '{{reservation_date}}', '{{org_name}}'],
};

import { Mail } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

function MailIcon() {
  return <Mail className="h-5 w-5 text-text-secondary" />;
}

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [expandedType, setExpandedType] = useState<string | null>(null);
  const [editSubject, setEditSubject] = useState('');
  const [editBody, setEditBody] = useState('');
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/settings/email-templates')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.templates)) {
          setTemplates(data.templates);
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  function getTemplate(eventType: string): Template {
    return (
      templates.find((t) => t.event_type === eventType) ?? {
        event_type: eventType,
        subject_template: '',
        body_template: '',
        enabled: true,
      }
    );
  }

  function handleExpand(eventType: string) {
    if (expandedType === eventType) {
      setExpandedType(null);
      return;
    }
    const tpl = getTemplate(eventType);
    setEditSubject(tpl.subject_template);
    setEditBody(tpl.body_template);
    setExpandedType(eventType);
  }

  async function handleToggle(eventType: string) {
    const tpl = getTemplate(eventType);
    const updated = { ...tpl, enabled: !tpl.enabled };

    setTemplates((prev) => {
      const existing = prev.findIndex((t) => t.event_type === eventType);
      if (existing >= 0) {
        const next = [...prev];
        next[existing] = updated;
        return next;
      }
      return [...prev, updated];
    });

    await fetch('/api/settings/email-templates', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    });
  }

  async function handleSaveTemplate() {
    if (!expandedType) return;
    setSaving(true);
    try {
      const tpl = getTemplate(expandedType);
      const payload = {
        event_type: expandedType,
        subject_template: editSubject,
        body_template: editBody,
        enabled: tpl.enabled,
      };

      const res = await fetch('/api/settings/email-templates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      setTemplates((prev) => {
        const existing = prev.findIndex((t) => t.event_type === expandedType);
        const updated = data.template ?? payload;
        if (existing >= 0) {
          const next = [...prev];
          next[existing] = updated;
          return next;
        }
        return [...prev, updated];
      });
      setExpandedType(null);
    } finally {
      setSaving(false);
    }
  }

  if (!loaded) return null;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Email Templates</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Customize notification emails sent to clients and team.
        </p>
      </div>

      <div className="space-y-3">
        {templateMeta.map((meta) => {
          const tpl = getTemplate(meta.event_type);
          const isExpanded = expandedType === meta.event_type;

          return (
            <div
              key={meta.event_type}
              className="rounded-xl border border-border bg-background px-6 py-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MailIcon />
                  <div>
                    <p className="text-sm font-medium text-foreground">{meta.title}</p>
                    <p className="text-xs text-text-secondary">{meta.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={tpl.enabled}
                    onClick={() => handleToggle(meta.event_type)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-normal ${
                      tpl.enabled ? 'bg-foreground' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow ring-0 transition duration-normal ${
                        tpl.enabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                  <button
                    onClick={() => handleExpand(meta.event_type)}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-gray-50 transition-colors"
                  >
                    {isExpanded ? 'Cancel' : 'Edit'}
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="mt-5 space-y-4 border-t border-border pt-5">
                  <div>
                    <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={editSubject}
                      onChange={(e) => setEditSubject(e.target.value)}
                      placeholder={`e.g. Your proposal from {{org_name}} is ready`}
                      className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5">
                      Body
                    </label>
                    <textarea
                      rows={6}
                      value={editBody}
                      onChange={(e) => setEditBody(e.target.value)}
                      placeholder="Write your email template body here..."
                      className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20 resize-y"
                    />
                  </div>
                  <div className="rounded-lg bg-gray-50 px-4 py-3">
                    <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1">
                      Available Variables
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {(variableHints[meta.event_type] ?? []).map((v) => (
                        <span
                          key={v}
                          className="inline-flex items-center rounded-md bg-background border border-border px-2 py-0.5 text-xs font-mono text-text-secondary"
                        >
                          {v}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={handleSaveTemplate} disabled={saving}>
                      {saving ? 'Saving...' : 'Save Template'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
