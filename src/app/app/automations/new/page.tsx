'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { TierGate } from '@/components/shared/TierGate';
import { TriggerSelector } from '@/components/admin/automations/TriggerSelector';
import { ActionSelector } from '@/components/admin/automations/ActionSelector';
import { createClient } from '@/lib/supabase/client';
import { resolveClientOrg } from '@/lib/auth/resolve-org-client';
export default function NewAutomationPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [triggerType, setTriggerType] = useState('');
  const [triggerConfig, setTriggerConfig] = useState<Record<string, unknown>>({});
  const [actionType, setActionType] = useState('');
  const [actionConfig, setActionConfig] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!name || !triggerType || !actionType) return;
    setSaving(true);
    setError(null);

    try {
      const supabase = createClient();

      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        setError('You must be logged in to create automations.');
        return;
      }

      // Resolve org via Harbor Master membership
      const { data: membership } = await supabase
        .from('organization_memberships')
        .select('organization_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .limit(1)
        .single();

      if (!membership?.organization_id) {
        setError('Could not determine your organization.');
        return;
      }

      const { error: insertError } = await supabase.from('automations').insert({
        organization_id: membership.organization_id,
        name,
        description: description || null,
        trigger_type: triggerType,
        trigger_config: triggerConfig,
        action_type: actionType,
        action_config: actionConfig,
        is_active: true,
      });

      if (insertError) {
        setError(insertError.message);
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

      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          New Automation
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Define a trigger event and an action to automate.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* Name + Description */}
        <div className="rounded-xl border border-border bg-white px-5 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Notify team on proposal approval"
              className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-foreground"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="What does this automation do?"
              className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-foreground"
            />
          </div>
        </div>

        {/* Trigger */}
        <div className="rounded-xl border border-border bg-white px-5 py-5">
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
        <div className="rounded-xl border border-border bg-white px-5 py-5">
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
