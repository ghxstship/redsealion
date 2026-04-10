'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { TierGate } from '@/components/shared/TierGate';
import { TriggerSelector } from '@/components/admin/automations/TriggerSelector';
import { ActionSelector } from '@/components/admin/automations/ActionSelector';
import PageHeader from '@/components/shared/PageHeader';
import { AUTOMATION_TEMPLATES } from '@/lib/automations/templates';

export default function NewAutomationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [triggerType, setTriggerType] = useState('');
  const [triggerConfig, setTriggerConfig] = useState<Record<string, unknown>>({});
  const [actionType, setActionType] = useState('');
  const [actionConfig, setActionConfig] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-fill from template if specified
  useEffect(() => {
    const templateId = searchParams.get('template');
    if (templateId) {
      const template = AUTOMATION_TEMPLATES.find((t) => t.id === templateId);
      if (template) {
        setName(template.name);
        setDescription(template.description);
        setTriggerType(template.trigger_type);
        setTriggerConfig(template.trigger_config);
        setActionType(template.action_type);
        setActionConfig(template.action_config);
      }
    }
  }, [searchParams]);

  async function handleSave() {
    if (!name || !triggerType || !actionType) return;
    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description: description || null,
          trigger_type: triggerType,
          trigger_config: triggerConfig,
          action_type: actionType,
          action_config: actionConfig,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? 'Failed to create automation.');
        return;
      }

      router.push('/app/automations');
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <TierGate feature="automations">
      <div className="mb-6">
        <Link
          href="/app/automations"
          className="text-sm text-text-secondary hover:text-foreground transition-colors"
        >
          &larr; Back to Automations
        </Link>
      </div>

      <PageHeader
        title="New Automation"
        subtitle="Define a trigger event and an action to automate."
      />

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* Name + Description */}
        <div className="rounded-xl border border-border bg-background px-5 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Notify team on proposal approval"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="What does this automation do?"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
            />
          </div>
        </div>

        {/* Trigger */}
        <div className="rounded-xl border border-border bg-background px-5 py-5">
          <h2 className="text-base font-semibold text-foreground mb-4">When this happens...</h2>
          <TriggerSelector
            value={triggerType}
            config={triggerConfig}
            onChange={(type, config) => {
              setTriggerType(type);
              setTriggerConfig(config);
            }}
          />
        </div>

        {/* Action */}
        <div className="rounded-xl border border-border bg-background px-5 py-5">
          <h2 className="text-base font-semibold text-foreground mb-4">Do this...</h2>
          <ActionSelector
            value={actionType}
            config={actionConfig}
            onChange={(type, config) => {
              setActionType(type);
              setActionConfig(config);
            }}
          />
        </div>

        {/* Save */}
        <div className="flex justify-end gap-3">
          <Link
            href="/app/automations"
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-bg-secondary transition-colors"
          >
            Cancel
          </Link>
          <button
            onClick={handleSave}
            disabled={saving || !name || !triggerType || !actionType}
            className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Create Automation'}
          </button>
        </div>
      </div>
    </TierGate>
  );
}
