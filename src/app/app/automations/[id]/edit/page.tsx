'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { TierGate } from '@/components/shared/TierGate';
import { TriggerSelector } from '@/components/admin/automations/TriggerSelector';
import { ActionSelector } from '@/components/admin/automations/ActionSelector';
import PageHeader from '@/components/shared/PageHeader';
import ConfirmDialog from '@/components/shared/ConfirmDialog';

export default function EditAutomationPage() {
  const router = useRouter();
  const params = useParams();
  const automationId = params.id as string;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [triggerType, setTriggerType] = useState('');
  const [triggerConfig, setTriggerConfig] = useState<Record<string, unknown>>({});
  const [actionType, setActionType] = useState('');
  const [actionConfig, setActionConfig] = useState<Record<string, unknown>>({});
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    async function loadAutomation() {
      try {
        const response = await fetch(`/api/automations/${automationId}`);
        if (!response.ok) {
          setError('Automation not found.');
          setLoading(false);
          return;
        }
        const data = await response.json();
        const automation = data.automation;
        setName(automation.name ?? '');
        setDescription(automation.description ?? '');
        setTriggerType(automation.trigger_type ?? '');
        setTriggerConfig(automation.trigger_config ?? {});
        setActionType(automation.action_type ?? '');
        setActionConfig(automation.action_config ?? {});
        setIsActive(automation.is_active ?? true);
      } catch {
        setError('Failed to load automation.');
      } finally {
        setLoading(false);
      }
    }

    loadAutomation();
  }, [automationId]);

  async function handleSave() {
    if (!name || !triggerType || !actionType) return;
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/automations/${automationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description: description || null,
          trigger_type: triggerType,
          trigger_config: triggerConfig,
          action_type: actionType,
          action_config: actionConfig,
          is_active: isActive,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? 'Failed to update automation.');
        return;
      }

      router.push(`/app/automations/${automationId}`);
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    setShowDeleteConfirm(false);

    try {
      const response = await fetch(`/api/automations/${automationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error ?? 'Failed to delete automation.');
        return;
      }

      router.push('/app/automations');
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-7 w-40 rounded bg-zinc-200" />
        <div className="rounded-xl border border-zinc-200 bg-background p-6 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-24 rounded bg-zinc-200" />
              <div className="h-10 w-full rounded-lg bg-zinc-100" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
    <TierGate feature="automations">
      <div className="mb-6">
        <Link
          href={`/app/automations/${automationId}`}
          className="text-sm text-text-secondary hover:text-foreground transition-colors"
        >
          &larr; Back to Automation
        </Link>
      </div>

      <PageHeader
        title="Edit Automation"
        subtitle="Update the trigger, action, and configuration."
      />

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* Name + Description + Active toggle */}
        <div className="rounded-xl border border-border bg-background px-5 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-foreground">Active</label>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isActive ? 'bg-green-500' : 'bg-zinc-300'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isActive ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
            <span className="text-sm text-text-secondary">{isActive ? 'Enabled' : 'Disabled'}</span>
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

        {/* Save / Delete */}
        <div className="flex justify-between">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            disabled={deleting}
            className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            {deleting ? 'Deleting...' : 'Delete Automation'}
          </button>
          <div className="flex gap-3">
            <Link
              href={`/app/automations/${automationId}`}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-bg-secondary transition-colors"
            >
              Cancel
            </Link>
            <button
              onClick={handleSave}
              disabled={saving || !name || !triggerType || !actionType}
              className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </TierGate>

    <ConfirmDialog
      open={showDeleteConfirm}
      title="Delete Automation"
      message="Are you sure you want to delete this automation? This action cannot be undone."
      variant="danger"
      confirmLabel="Delete"
      onConfirm={handleDelete}
      onCancel={() => setShowDeleteConfirm(false)}
    />
    </>
  );
}
