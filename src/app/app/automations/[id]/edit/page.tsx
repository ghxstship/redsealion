import Button from '@/components/ui/Button';
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { TierGate } from '@/components/shared/TierGate';
import { TriggerSelector } from '@/components/admin/automations/TriggerSelector';
import { ActionSelector } from '@/components/admin/automations/ActionSelector';
import PageHeader from '@/components/shared/PageHeader';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import Alert from '@/components/ui/Alert';
import Toggle from '@/components/ui/Toggle';
import FormInput from '@/components/ui/FormInput';
import FormLabel from '@/components/ui/FormLabel';
import Skeleton from '@/components/ui/Skeleton';
import FormTextarea from '@/components/ui/FormTextarea';

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
    return <Skeleton className="max-w-4xl" height="h-[600px]" />;
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
        <Alert variant="error">{error}</Alert>
      )}

      <div className="space-y-6">
        {/* Name + Description + Active toggle */}
        <div className="rounded-xl border border-border bg-background px-5 py-5 space-y-4">
          <div>
            <FormLabel>Name</FormLabel>
            <FormInput
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <FormLabel>Description</FormLabel>
            <FormTextarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-foreground/10 px-3 py-2"
            />
          </div>
          <div className="flex items-center gap-3">
            <Toggle
              checked={isActive}
              onChange={setIsActive}
              label={isActive ? 'Enabled' : 'Disabled'}
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

        {/* Save / Delete */}
        <div className="flex justify-between">
          <Button
            onClick={() => setShowDeleteConfirm(true)}
            disabled={deleting}
            className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            {deleting ? 'Deleting...' : 'Delete Automation'}
          </Button>
          <div className="flex gap-3">
            <Link
              href={`/app/automations/${automationId}`}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-bg-secondary transition-colors"
            >
              Cancel
            </Link>
            <Button
              onClick={handleSave}
              disabled={saving || !name || !triggerType || !actionType}
              className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
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
