'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { TierGate } from '@/components/shared/TierGate';
import { ReportBuilder } from '@/components/admin/reports/ReportBuilder';
import PageHeader from '@/components/shared/PageHeader';
import ReportsHubTabs from '../../ReportsHubTabs';
import Card from '@/components/ui/Card';
import Alert from '@/components/ui/Alert';
import { createClient } from '@/lib/supabase/client';
import { resolveClientOrg } from '@/lib/auth/resolve-org-client';
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
      const ctx = await resolveClientOrg();
      if (!ctx) {
        setError('You must be logged in.');
        setSaving(false);
        return;
      }

      const { error: insertError } = await supabase.from('custom_reports').insert({
        organization_id: ctx.organizationId,
        name,
        description: descriptionRef.current?.value?.trim() || null,
        config,
        created_by: ctx.userId,
      });

      if (insertError) {
        // Error surfaced via insertError.message below
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
      // Unexpected error — surfaced via setError below
      setError('An unexpected error occurred. Please try again.');
      setSaving(false);
    }
  }

  return (
    <TierGate feature="custom_reports">
      <PageHeader
        title="Report Builder"
        subtitle="Create custom reports with your chosen data sources, columns, and filters."
      />

      <ReportsHubTabs />

      {saved && (
        <Alert variant="success">
          Report saved successfully. Redirecting to reports...
        </Alert>
      )}

      {error && (
        <Alert variant="error">{error}</Alert>
      )}

      <Card>
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
      </Card>
    </TierGate>
  );
}
