'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { TierGate } from '@/components/shared/TierGate';
import { TriggerSelector } from '@/components/admin/automations/TriggerSelector';
import { ActionSelector } from '@/components/admin/automations/ActionSelector';
import PageHeader from '@/components/shared/PageHeader';
import { AUTOMATION_TEMPLATES } from '@/lib/automations/templates';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import FormInput from '@/components/ui/FormInput';
import FormLabel from '@/components/ui/FormLabel';
import FormTextarea from '@/components/ui/FormTextarea';

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
        <Alert variant="error">{error}</Alert>
      )}

      <div className="space-y-6">
        {/* Name + Description */}
        <div className="rounded-xl border border-border bg-background px-5 py-5 space-y-4">
          <div>
            <FormLabel>Name</FormLabel>
            <FormInput
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Notify team on proposal approval"
            />
          </div>
          <div>
            <FormLabel>Description</FormLabel>
            <FormTextarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="What does this automation do?"
              className="w-full rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-foreground/10 px-3 py-2"
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
          <Button variant="secondary" href="/app/automations">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !name || !triggerType || !actionType}
          >
            {saving ? 'Saving...' : 'Create Automation'}
          </Button>
        </div>
      </div>
    </TierGate>
  );
}
