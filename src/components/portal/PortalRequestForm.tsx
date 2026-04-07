'use client';

import { useState } from 'react';
import Alert from '@/components/ui/Alert';
import FormSelect from '@/components/ui/FormSelect';
import FormTextarea from '@/components/ui/FormTextarea';
import FormInput from '@/components/ui/FormInput';
import FormLabel from '@/components/ui/FormLabel';

interface PortalRequestFormProps {
  orgSlug: string;
  orgId: string;
  orgName: string;
}

export default function PortalRequestForm({ orgSlug, orgId, orgName }: PortalRequestFormProps) {
  const [formState, setFormState] = useState({
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    event_type: '',
    event_date: '',
    estimated_budget: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setFormState((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formState.contact_name || !formState.contact_email) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/public/portal-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: orgId,
          source: 'Client Portal',
          contact_name: formState.contact_name,
          contact_email: formState.contact_email,
          contact_phone: formState.contact_phone || undefined,
          event_type: formState.event_type || undefined,
          event_date: formState.event_date || undefined,
          estimated_budget: formState.estimated_budget ? Number(formState.estimated_budget) : undefined,
          message: formState.message || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to submit request.');
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-green-900">Request Submitted</h3>
        <p className="mt-2 text-sm text-green-700">
          Thank you! The {orgName} team will review your request and get back to you shortly.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert className="mb-4">{error}</Alert>
      )}

      {/* Contact Info */}
      <div className="rounded-xl border border-border bg-background p-5 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Your Information</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <FormLabel htmlFor="pr-contact-name">
              Full Name <span className="text-red-500">*</span>
            </FormLabel>
            <FormInput
              id="pr-contact-name"
              name="contact_name"
              type="text"
              required
              value={formState.contact_name}
              onChange={handleChange}
              placeholder="Jane Smith"
            />
          </div>
          <div>
            <FormLabel htmlFor="pr-contact-email">
              Email <span className="text-red-500">*</span>
            </FormLabel>
            <FormInput
              id="pr-contact-email"
              name="contact_email"
              type="email"
              required
              value={formState.contact_email}
              onChange={handleChange}
              placeholder="jane@company.com"
            />
          </div>
        </div>
        <div>
          <FormLabel htmlFor="pr-contact-phone">
            Phone
          </FormLabel>
          <FormInput
            id="pr-contact-phone"
            name="contact_phone"
            type="tel"
            value={formState.contact_phone}
            onChange={handleChange}
            placeholder="+1 (555) 123-4567"
          />
        </div>
      </div>

      {/* Project Details */}
      <div className="rounded-xl border border-border bg-background p-5 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Project Details</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <FormLabel htmlFor="pr-event-type">
              Event Type
            </FormLabel>
            <FormSelect
              id="pr-event-type"
              name="event_type"
              value={formState.event_type}
              onChange={handleChange}
            >
              <option value="">Select type...</option>
              <option value="corporate_event">Corporate Event</option>
              <option value="live_concert">Live Concert / Festival</option>
              <option value="brand_activation">Brand Activation</option>
              <option value="trade_show">Trade Show / Expo</option>
              <option value="immersive_experience">Immersive Experience</option>
              <option value="pop_up">Pop-Up</option>
              <option value="theatrical">Theatrical Production</option>
              <option value="film_broadcast">Film / TV / Broadcast</option>
              <option value="other">Other</option>
            </FormSelect>
          </div>
          <div>
            <FormLabel htmlFor="pr-event-date">
              Target Date
            </FormLabel>
            <FormInput
              id="pr-event-date"
              name="event_date"
              type="date"
              value={formState.event_date}
              onChange={handleChange}
            />
          </div>
        </div>
        <div>
          <FormLabel htmlFor="pr-budget">
            Estimated Budget
          </FormLabel>
          <FormInput
            id="pr-budget"
            name="estimated_budget"
            type="number"
            min="0"
            step="1000"
            value={formState.estimated_budget}
            onChange={handleChange}
            placeholder="50000"
          />
        </div>
      </div>

      {/* Message */}
      <div className="rounded-xl border border-border bg-background p-5 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Additional Details</h3>
        <div>
          <FormLabel htmlFor="pr-message">
            Tell us about your project
          </FormLabel>
          <FormTextarea
            id="pr-message"
            name="message"
            rows={4}
            value={formState.message}
            onChange={handleChange}
            placeholder="Describe the event, venue, audience size, and any special requirements..." />
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitting || !formState.contact_name || !formState.contact_email}
          className="rounded-lg px-6 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: 'var(--org-primary, var(--color-foreground))' }}
        >
          {submitting ? 'Submitting…' : 'Submit Request'}
        </button>
      </div>
    </form>
  );
}
