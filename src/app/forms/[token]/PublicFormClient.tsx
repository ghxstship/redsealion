'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import FormInput from '@/components/ui/FormInput';
import FormTextarea from '@/components/ui/FormTextarea';

interface LeadForm {
  id: string;
  name: string;
  description: string | null;
  fields: Record<string, unknown>[];
  embed_token: string;
  organization_id: string;
  brand_config?: {
    primaryColor?: string;
    backgroundColor?: string;
    fontHeading?: string;
    fontBody?: string;
  };
}

export default function PublicFormClient({ form }: { form: LeadForm }) {
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const formData = new FormData(e.currentTarget);
    const data: Record<string, unknown> = {
      embed_token: form.embed_token,
      // Default mappings that the intake API expects
      contact_first_name: formData.get('first_name') || formData.get('contact_first_name') || '',
      contact_last_name: formData.get('last_name') || formData.get('contact_last_name') || '',
      contact_email: formData.get('email') || formData.get('contact_email') || '',
      contact_phone: formData.get('phone') || formData.get('contact_phone'),
      company_name: formData.get('company') || formData.get('company_name'),
      event_type: formData.get('event_type'),
      event_date: formData.get('event_date'),
      estimated_budget: formData.get('budget') || formData.get('estimated_budget'),
      message: formData.get('message'),
    };

    // Include any custom fields exactly as named
    for (const [key, value] of formData.entries()) {
      if (!data[key]) {
        data[key] = value;
      }
    }

    try {
      const res = await fetch('/api/public/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Failed to submit form');
      }

      setSuccessMsg(result.thank_you_message || 'Thank you! Your submission has been received.');
      if (result.redirect_url) {
        setTimeout(() => {
          window.location.href = result.redirect_url;
        }, 1500);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'An error occurred.');
    } finally {
      setLoading(false);
    }
  }

  if (successMsg) {
    return (
      <div className="text-center py-8">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 mb-4">
          <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Success</h3>
        <p className="text-sm text-gray-600">{successMsg}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {errorMsg && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-100">
          {errorMsg}
        </div>
      )}

      {/* Render mapped fields for demo purposes based on standard intake fields */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
          <FormInput required name="first_name" type="text" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-opacity-50" style={{ '--tw-ring-color': form.brand_config?.primaryColor || '#3b82f6' } as React.CSSProperties} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
          <FormInput name="last_name" type="text" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-opacity-50" style={{ '--tw-ring-color': form.brand_config?.primaryColor || '#3b82f6' } as React.CSSProperties} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
        <FormInput required name="email" type="email" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-opacity-50" style={{ '--tw-ring-color': form.brand_config?.primaryColor || '#3b82f6' } as React.CSSProperties} />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
        <FormInput name="phone" type="tel" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-opacity-50" style={{ '--tw-ring-color': form.brand_config?.primaryColor || '#3b82f6' } as React.CSSProperties} />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
        <FormInput name="company" type="text" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-opacity-50" style={{ '--tw-ring-color': form.brand_config?.primaryColor || '#3b82f6' } as React.CSSProperties} />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
          <FormInput name="event_type" type="text" placeholder="e.g. Corporate, Wedding" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-opacity-50" style={{ '--tw-ring-color': form.brand_config?.primaryColor || '#3b82f6' } as React.CSSProperties} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Event Date</label>
          <FormInput name="event_date" type="date" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-opacity-50" style={{ '--tw-ring-color': form.brand_config?.primaryColor || '#3b82f6' } as React.CSSProperties} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Budget</label>
        <FormInput name="budget" type="number" step="100" min="0" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-opacity-50" style={{ '--tw-ring-color': form.brand_config?.primaryColor || '#3b82f6' } as React.CSSProperties} />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">How can we help you?</label>
        <FormTextarea name="message" rows={4} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-opacity-50" style={{ '--tw-ring-color': form.brand_config?.primaryColor || '#3b82f6' } as React.CSSProperties}></FormTextarea>
      </div>

      <div className="pt-2">
        <Button 
          type="submit" 
          disabled={loading}
          className="w-full py-2.5 flex justify-center items-center"
          style={{ 
            backgroundColor: form.brand_config?.primaryColor || undefined,
            borderColor: form.brand_config?.primaryColor || undefined,
          }}
        >
          {loading ? 'Submitting...' : 'Submit'}
        </Button>
      </div>
    </form>
  );
}
