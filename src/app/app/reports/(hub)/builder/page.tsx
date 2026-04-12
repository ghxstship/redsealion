import FormInput from '@/components/ui/FormInput';
'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { TierGate } from '@/components/shared/TierGate';
import { ReportBuilder } from '@/components/admin/reports/ReportBuilder';
import PageHeader from '@/components/shared/PageHeader';
import ReportsHubTabs from '../../ReportsHubTabs';
import Card from '@/components/ui/Card';
import Alert from '@/components/ui/Alert';
import { createClient } from '@/lib/supabase/client';
import { resolveClientOrg } from '@/lib/auth/resolve-org-client';
import FormSelect from '@/components/ui/FormSelect';
import FormTextarea from '@/components/ui/FormTextarea';

const FREQUENCY_OPTIONS = [
  { value: '', label: 'No schedule (manual only)' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

const DAY_OPTIONS = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' },
];

export default function ReportBuilderPage() {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLInputElement>(null);

  // Schedule delivery state
  const [frequency, setFrequency] = useState('');
  const [day, setDay] = useState('monday');
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [recipientsInput, setRecipientsInput] = useState('');

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

    // Parse recipients
    const recipients = recipientsInput
      .split(/[,;\n]+/)
      .map((e) => e.trim())
      .filter((e) => e.includes('@'));

    if (frequency && recipients.length === 0) {
      setError('At least one recipient email is required for scheduled delivery.');
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

      // Build schedule config
      const schedule = frequency
        ? {
            frequency,
            ...(frequency === 'weekly' ? { day } : {}),
            ...(frequency === 'monthly' ? { dayOfMonth } : {}),
            time: '09:00',
          }
        : null;

      const { error: insertError } = await supabase.from('custom_reports').insert({
        organization_id: ctx.organizationId,
        name,
        description: descriptionRef.current?.value?.trim() || null,
        query_config: config,
        created_by: ctx.userId,
        schedule,
        recipients: recipients.length > 0 ? recipients : null,
      });

      if (insertError) {
        setError(insertError.message || 'Failed to save the report.');
        setSaving(false);
        return;
      }

      setSaved(true);
      // Navigate back to reports list after a short delay so the user sees the success message
      setTimeout(() => {
        router.push('/app/reports');
      }, 1500);
    } catch {
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
            <FormInput
              ref={nameRef}
              type="text"
              placeholder="e.g., Monthly revenue by client"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Description
            </label>
            <FormInput
              ref={descriptionRef}
              type="text"
              placeholder="Brief description of this report"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
            />
          </div>
        </div>

        <ReportBuilder
          onSave={(config) => {
            if (!saving) handleSave(config);
          }}
        />

        {/* ─── Scheduled Delivery ─────────────────────────────── */}
        <div className="mt-8 pt-6 border-t border-border">
          <h3 className="text-sm font-semibold text-foreground mb-1">Scheduled Delivery</h3>
          <p className="text-xs text-text-muted mb-4">
            Optionally deliver this report via email on a recurring schedule.
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Frequency */}
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">Frequency</label>
              <FormSelect
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
              >
                {FREQUENCY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </FormSelect>
            </div>

            {/* Weekly: day selector */}
            {frequency === 'weekly' && (
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5">Day</label>
                <FormSelect
                  value={day}
                  onChange={(e) => setDay(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                >
                  {DAY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </FormSelect>
              </div>
            )}

            {/* Monthly: day of month */}
            {frequency === 'monthly' && (
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5">Day of Month</label>
                <FormSelect
                  value={dayOfMonth}
                  onChange={(e) => setDayOfMonth(parseInt(e.target.value, 10))}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                >
                  {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </FormSelect>
              </div>
            )}
          </div>

          {/* Recipients */}
          {frequency && (
            <div className="mt-4">
              <label className="block text-xs font-medium text-text-muted mb-1.5">
                Recipients (email addresses, comma-separated)
              </label>
              <FormTextarea
                value={recipientsInput}
                onChange={(e) => setRecipientsInput(e.target.value)}
                placeholder="e.g., cfo@company.com, manager@company.com"
                rows={2}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground resize-none"
              />
              <p className="mt-1 text-[11px] text-text-muted">
                Reports will be delivered as an email with a data summary table around 9:00 AM UTC.
              </p>
            </div>
          )}
        </div>

        {saving && !saved && (
          <div className="mt-4 text-sm text-text-secondary">Saving report...</div>
        )}
      </Card>
    </TierGate>
  );
}

