'use client';

import React, { useState } from 'react';

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
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to submit form');
      }

      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="w-full max-w-lg mx-auto relative overflow-hidden rounded-2xl border border-white/20 bg-white/10 p-8 text-center shadow-2xl backdrop-blur-xl">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20 text-green-400">
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="mb-2 text-2xl font-semibold text-white">Thank You!</h3>
        <p className="text-white/80">
          Your inquiry has been received. We will be in touch shortly to discuss your upcoming project.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl mx-auto relative overflow-hidden rounded-2xl border border-white/20 bg-white/10 p-8 shadow-2xl backdrop-blur-xl">
      {/* Subtle glowing orb backgrounds */}
      <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-blue-500/30 blur-3xl" />
      <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-purple-500/30 blur-3xl" />

      <div className="relative z-10">
        <h2 className="mb-2 text-3xl font-bold tracking-tight text-white">Start Your Project</h2>
        <p className="mb-8 text-white/70">
          Tell us about what you're building. We'll set everything up and get back to you immediately.
        </p>

        {error && (
          <div className="mb-6 rounded-lg bg-red-500/20 p-4 border border-red-500/30 text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="contact_first_name" className="text-sm font-medium text-white/80">First Name *</label>
              <input
                required
                type="text"
                id="contact_first_name"
                name="contact_first_name"
                className="w-full rounded-xl border border-white/10 bg-white/5 py-3 px-4 text-white placeholder-white/30 transition-colors focus:border-white/30 focus:bg-white/10 focus:outline-none focus:ring-4 focus:ring-white/5"
                placeholder="Jane"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="contact_last_name" className="text-sm font-medium text-white/80">Last Name</label>
              <input
                type="text"
                id="contact_last_name"
                name="contact_last_name"
                className="w-full rounded-xl border border-white/10 bg-white/5 py-3 px-4 text-white placeholder-white/30 transition-colors focus:border-white/30 focus:bg-white/10 focus:outline-none focus:ring-4 focus:ring-white/5"
                placeholder="Doe"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="contact_email" className="text-sm font-medium text-white/80">Email Address *</label>
              <input
                required
                type="email"
                id="contact_email"
                name="contact_email"
                className="w-full rounded-xl border border-white/10 bg-white/5 py-3 px-4 text-white placeholder-white/30 transition-colors focus:border-white/30 focus:bg-white/10 focus:outline-none focus:ring-4 focus:ring-white/5"
                placeholder="jane@example.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="company_name" className="text-sm font-medium text-white/80">Company Name</label>
              <input
                type="text"
                id="company_name"
                name="company_name"
                className="w-full rounded-xl border border-white/10 bg-white/5 py-3 px-4 text-white placeholder-white/30 transition-colors focus:border-white/30 focus:bg-white/10 focus:outline-none focus:ring-4 focus:ring-white/5"
                placeholder="Acme Corp"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="contact_phone" className="text-sm font-medium text-white/80">Phone Number</label>
              <input
                type="tel"
                id="contact_phone"
                name="contact_phone"
                className="w-full rounded-xl border border-white/10 bg-white/5 py-3 px-4 text-white placeholder-white/30 transition-colors focus:border-white/30 focus:bg-white/10 focus:outline-none focus:ring-4 focus:ring-white/5"
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>

          <div className="space-y-1">
             <label htmlFor="event_type" className="text-sm font-medium text-white/80">Project / Event Type</label>
             <input
                type="text"
                id="event_type"
                name="event_type"
                className="w-full rounded-xl border border-white/10 bg-white/5 py-3 px-4 text-white placeholder-white/30 transition-colors focus:border-white/30 focus:bg-white/10 focus:outline-none focus:ring-4 focus:ring-white/5"
                placeholder="e.g. Brand Activation, Custom Stage, etc."
              />
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="event_date" className="text-sm font-medium text-white/80">Target Date</label>
              <input
                type="date"
                id="event_date"
                name="event_date"
                className="w-full rounded-xl border border-white/10 bg-white/5 py-3 px-4 text-white placeholder-white/30 transition-colors focus:border-white/30 focus:bg-white/10 focus:outline-none focus:ring-4 focus:ring-white/5 [color-scheme:dark]"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="estimated_budget" className="text-sm font-medium text-white/80">Estimated Budget (USD)</label>
              <select
                id="estimated_budget"
                name="estimated_budget"
                className="w-full rounded-xl border border-white/10 bg-white/5 py-3 px-4 text-white placeholder-white/30 transition-colors focus:border-white/30 focus:bg-white/10 focus:outline-none focus:ring-4 focus:ring-white/5 [&>option]:bg-zinc-900"
              >
                <option value="">Select Range...</option>
                <option value="10000">$10k - $25k</option>
                <option value="25000">$25k - $50k</option>
                <option value="50000">$50k - $100k</option>
                <option value="100000">$100k - $250k</option>
                <option value="500000">$500k+</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="message" className="text-sm font-medium text-white/80">Additional Details</label>
            <textarea
              id="message"
              name="message"
              rows={4}
              className="w-full rounded-xl border border-white/10 bg-white/5 py-3 px-4 text-white placeholder-white/30 transition-colors focus:border-white/30 focus:bg-white/10 focus:outline-none focus:ring-4 focus:ring-white/5 resize-none"
              placeholder="Tell us more about the goals, scale, and requirements of the project..."
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-base font-semibold text-zinc-900 transition-all hover:bg-white/90 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
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
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
