'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { TierGate } from '@/components/shared/TierGate';
import { ReportBuilder } from '@/components/admin/reports/ReportBuilder';
import { createClient } from '@/lib/supabase/client';

export default function ReportBuilderPage() {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLInputElement>(null);

  async function handleSave(config: {
    dataSource: string;
    visualization: string;
    columns: { id: string; field: string; label: string; aggregate?: string }[];
    filters: { id: string; field: string; operator: string; value: string }[];
  }) {
    setError(null);
    setSaving(true);

    const name = nameRef.current?.value?.trim();
    if (!name) {
      setError('Report name is required.');
      setSaving(false);
      return;
    }

    try {
      const supabase = createClient();

      // Get current user and org
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('You must be logged in to save reports.');
        setSaving(false);
        return;
      }

      const { data: userData } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!userData) {
        setError('Could not determine your organization.');
        setSaving(false);
        return;
      }

      const { error: insertError } = await supabase.from('custom_reports').insert({
        organization_id: userData.organization_id,
        name,
        description: descriptionRef.current?.value?.trim() || null,
        config,
        created_by: user.id,
      });

      if (insertError) {
        console.error('Failed to save report:', insertError);
        setError(insertError.message || 'Failed to save the report.');
        setSaving(false);
        return;
      }

      setSaved(true);
      // Navigate back to reports list after a short delay so the user sees the success message
      setTimeout(() => {
        router.push('/app/reports');
      }, 1500);
    } catch (err) {
      console.error('Unexpected error saving report:', err);
      setError('An unexpected error occurred. Please try again.');
      setSaving(false);
    }
  }

  return (
    <TierGate feature="custom_reports">
      <div className="mb-6">
        <Link
          href="/app/reports"
          className="text-sm text-text-secondary hover:text-foreground transition-colors"
        >
          &larr; Back to Reports
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Report Builder
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Create custom reports with your chosen data sources, columns, and filters.
        </p>
      </div>

      {saved && (
        <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-5 py-3">
          <p className="text-sm text-green-800">
            Report saved successfully. Redirecting to reports...
          </p>
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-3">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="rounded-xl border border-border bg-white px-5 py-5">
        <div className="mb-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Report Name
            </label>
            <input
              ref={nameRef}
              type="text"
              placeholder="e.g., Monthly revenue by client"
              className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-foreground"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Description
            </label>
            <input
              ref={descriptionRef}
              type="text"
              placeholder="Brief description of this report"
              className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-foreground"
            />
          </div>
        </div>

        <ReportBuilder
          onSave={(config) => {
            if (!saving) handleSave(config);
          }}
        />

        {saving && !saved && (
          <div className="mt-4 text-sm text-text-secondary">Saving report...</div>
        )}
      </div>
    </TierGate>
  );
}
