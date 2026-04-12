'use client';

import React, { useState } from 'react';
import FormSelect from '@/components/ui/FormSelect';
import FormTextarea from '@/components/ui/FormTextarea';
import FormInput from '@/components/ui/FormInput';
import FormLabel from '@/components/ui/FormLabel';
import { IconCheck } from '@/components/ui/Icons';
import Button from '@/components/ui/Button';

/**
 * LeadIntakeForm
 * 
 * A glass-morphic intake form intended to be public-facing.
 */
export function LeadIntakeForm({ organizationId }: { organizationId: string }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const payload = {
      organization_id: organizationId,
      company_name: formData.get('company_name'),
      contact_first_name: formData.get('contact_first_name'),
      contact_last_name: formData.get('contact_last_name'),
      contact_email: formData.get('contact_email'),
      contact_phone: formData.get('contact_phone'),
      event_type: formData.get('event_type'),
      event_date: formData.get('event_date'),
      estimated_budget: formData.get('estimated_budget'),
      message: formData.get('message'),
    };

    try {
      const response = await fetch('/api/public/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        if (response.status === 429) {
          const retryAfter = parseInt(response.headers.get('Retry-After') || '60', 10);
          throw new Error(`Too many submissions. Please wait ${retryAfter} seconds before trying again.`);
        }
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to submit form');
      }

      setIsSuccess(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="w-full max-w-lg mx-auto relative overflow-hidden rounded-2xl border border-white/20 bg-background/10 p-8 text-center shadow-2xl backdrop-blur-xl">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20 text-green-400">
          <IconCheck className="h-8 w-8 text-green-400" strokeWidth={2} />
        </div>
        <h3 className="mb-2 text-2xl font-semibold text-white">Thank You!</h3>
        <p className="text-white/80">
          Your inquiry has been received. We will be in touch shortly to discuss your upcoming project.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl mx-auto relative overflow-hidden rounded-2xl border border-white/20 bg-background/10 p-8 shadow-2xl backdrop-blur-xl">
      {/* Subtle glowing orb backgrounds */}
      <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-blue-500/30 blur-3xl" />
      <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-purple-500/30 blur-3xl" />

      <div className="relative z-10">
        <h2 className="mb-2 text-3xl font-bold tracking-tight text-white">Start Your Project</h2>
        <p className="mb-8 text-white/70">
          Tell us about what you&apos;re building. We&apos;ll set everything up and get back to you immediately.
        </p>

        {error && (
          <div className="mb-6 rounded-lg bg-red-500/20 p-4 border border-red-500/30 text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="space-y-1">
              <FormLabel htmlFor="contact_first_name">First Name *</FormLabel>
              <FormInput
                required
                type="text"
                id="contact_first_name"
                name="contact_first_name"
                placeholder="Jane" />
            </div>
            <div className="space-y-1">
              <FormLabel htmlFor="contact_last_name">Last Name</FormLabel>
              <FormInput
                type="text"
                id="contact_last_name"
                name="contact_last_name"
                placeholder="Doe" />
            </div>
            <div className="space-y-1">
              <FormLabel htmlFor="contact_email">Email Address *</FormLabel>
              <FormInput
                required
                type="email"
                id="contact_email"
                name="contact_email"
                placeholder="jane@example.com" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="space-y-1">
              <FormLabel htmlFor="company_name">Company Name</FormLabel>
              <FormInput
                type="text"
                id="company_name"
                name="company_name"
                placeholder="Acme Corp" />
            </div>
            <div className="space-y-1">
              <FormLabel htmlFor="contact_phone">Phone Number</FormLabel>
              <FormInput
                type="tel"
                id="contact_phone"
                name="contact_phone"
                placeholder="+1 (555) 123-4567" />
            </div>
          </div>

          <div className="space-y-1">
             <FormLabel htmlFor="event_type">Project / Event Type</FormLabel>
             <FormInput
                type="text"
                id="event_type"
                name="event_type"
                placeholder="e.g. Brand Activation, Custom Stage, etc." />
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="space-y-1">
              <FormLabel htmlFor="event_date">Target Date</FormLabel>
              <FormInput
                type="date"
                id="event_date"
                name="event_date" />
            </div>
            <div className="space-y-1">
              <FormLabel htmlFor="estimated_budget">Estimated Budget (USD)</FormLabel>
              <FormSelect
                id="estimated_budget"
                name="estimated_budget"
              >
                <option value="">Select Range...</option>
                <option value="10000">$10k - $25k</option>
                <option value="25000">$25k - $50k</option>
                <option value="50000">$50k - $100k</option>
                <option value="100000">$100k - $250k</option>
                <option value="500000">$500k+</option>
              </FormSelect>
            </div>
          </div>

          <div className="space-y-1">
            <FormLabel htmlFor="message">Additional Details</FormLabel>
            <FormTextarea
              id="message"
              name="message"
              rows={4}
              placeholder="Tell us more about the goals, scale, and requirements of the project..." />
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-background px-6 py-3.5 text-base font-semibold text-zinc-900 transition-all hover:bg-background/90 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-zinc-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Initiating Project...
                </>
              ) : (
                'Submit Inquiry'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
