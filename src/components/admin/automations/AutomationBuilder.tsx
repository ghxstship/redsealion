'use client';

/**
 * Visual automation builder — configure automations with a
 * trigger → condition → action flow UI.
 *
 * @module components/admin/automations/AutomationBuilder
 */

import { useState } from 'react';
import { formatLabel } from '@/lib/utils';
import ModalShell from '@/components/ui/ModalShell';
import FormLabel from '@/components/ui/FormLabel';
import FormInput from '@/components/ui/FormInput';
import FormSelect from '@/components/ui/FormSelect';
import FormTextarea from '@/components/ui/FormTextarea';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import { Zap, ArrowRight, Filter, Play } from 'lucide-react';

const TRIGGER_TYPES = [
  'task_created', 'task_status_change', 'task_assigned', 'task_overdue',
  'proposal_approved', 'proposal_sent', 'proposal_viewed',
  'invoice_created', 'invoice_sent', 'invoice_overdue', 'invoice_paid',
  'milestone_completed', 'deal_stage_change',
  'expense_submitted', 'comment_added', 'mention_received',
] as const;

const ACTION_TYPES = [
  'send_email', 'send_slack', 'create_task', 'update_status',
  'assign_user', 'create_invoice', 'add_comment', 'webhook',
] as const;

const CONDITION_OPERATORS = [
  'equals', 'not_equals', 'greater_than', 'less_than', 'contains',
] as const;

interface AutomationBuilderProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  initialTemplate?: {
    name?: string;
    trigger_type?: string;
    action_type?: string;
    action_config?: Record<string, unknown>;
  };
}

export default function AutomationBuilder({
  open,
  onClose,
  onCreated,
  initialTemplate,
}: AutomationBuilderProps) {
  const [name, setName] = useState(initialTemplate?.name ?? '');
  const [triggerType, setTriggerType] = useState(initialTemplate?.trigger_type ?? 'task_status_change');
  const [actionType, setActionType] = useState(initialTemplate?.action_type ?? 'send_email');

  // Conditions
  const [conditions, setConditions] = useState<
    Array<{ field: string; operator: string; value: string }>
  >([]);

  // Action config
  const [actionConfig, setActionConfig] = useState<Record<string, string>>(
    (initialTemplate?.action_config as Record<string, string>) ?? {},
  );

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step tracker
  const [step, setStep] = useState<'trigger' | 'conditions' | 'action' | 'review'>('trigger');

  function addCondition() {
    setConditions((prev) => [...prev, { field: '', operator: 'equals', value: '' }]);
  }

  function updateCondition(idx: number, key: string, val: string) {
    setConditions((prev) =>
      prev.map((c, i) => (i === idx ? { ...c, [key]: val } : c)),
    );
  }

  function removeCondition(idx: number) {
    setConditions((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit() {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          trigger_type: triggerType,
          trigger_config: { conditions: conditions.filter((c) => c.field) },
          action_type: actionType,
          action_config: actionConfig,
          is_active: true,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to create automation');
      }

      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  }

  const steps = [
    { key: 'trigger', label: 'When', icon: <Zap size={14} /> },
    { key: 'conditions', label: 'If', icon: <Filter size={14} /> },
    { key: 'action', label: 'Then', icon: <Play size={14} /> },
    { key: 'review', label: 'Review', icon: <ArrowRight size={14} /> },
  ] as const;

  return (
    <ModalShell open={open} onClose={onClose} title="Build Automation" size="lg">
      {error && <Alert className="mb-4">{error}</Alert>}

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6">
        {steps.map((s, idx) => (
          <button
            key={s.key}
            onClick={() => setStep(s.key as typeof step)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              step === s.key
                ? 'bg-foreground text-background'
                : 'bg-bg-secondary text-text-muted hover:text-foreground'
            }`}
          >
            {s.icon}
            {s.label}
          </button>
        ))}
      </div>

      {/* Step content */}
      {step === 'trigger' && (
        <div className="space-y-4">
          <div>
            <FormLabel>Automation Name</FormLabel>
            <FormInput
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Notify team on task completion"
            />
          </div>
          <div>
            <FormLabel>When this happens</FormLabel>
            <FormSelect value={triggerType} onChange={(e) => setTriggerType(e.target.value)}>
              {TRIGGER_TYPES.map((t) => (
                <option key={t} value={t}>{formatLabel(t)}</option>
              ))}
            </FormSelect>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setStep('conditions')}>Next: Conditions →</Button>
          </div>
        </div>
      )}

      {step === 'conditions' && (
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Add conditions to filter when this automation runs. Leave empty to run on every trigger.
          </p>

          {conditions.map((cond, idx) => (
            <div key={idx} className="flex items-center gap-2 rounded-lg border border-border bg-bg-secondary/30 p-3">
              <FormInput
                type="text"
                value={cond.field}
                onChange={(e) => updateCondition(idx, 'field', e.target.value)}
                placeholder="Field (e.g. status)"
                className="flex-1"
              />
              <FormSelect
                value={cond.operator}
                onChange={(e) => updateCondition(idx, 'operator', e.target.value)}
                className="w-32"
              >
                {CONDITION_OPERATORS.map((op) => (
                  <option key={op} value={op}>{formatLabel(op)}</option>
                ))}
              </FormSelect>
              <FormInput
                type="text"
                value={cond.value}
                onChange={(e) => updateCondition(idx, 'value', e.target.value)}
                placeholder="Value"
                className="flex-1"
              />
              <button
                onClick={() => removeCondition(idx)}
                className="text-text-muted hover:text-red-600 transition-colors"
              >
                ×
              </button>
            </div>
          ))}

          <button
            onClick={addCondition}
            className="text-xs font-medium text-text-muted hover:text-foreground transition-colors"
          >
            + Add condition
          </button>

          <div className="flex justify-between">
            <Button variant="secondary" onClick={() => setStep('trigger')}>← Back</Button>
            <Button onClick={() => setStep('action')}>Next: Action →</Button>
          </div>
        </div>
      )}

      {step === 'action' && (
        <div className="space-y-4">
          <div>
            <FormLabel>Then do this</FormLabel>
            <FormSelect value={actionType} onChange={(e) => setActionType(e.target.value)}>
              {ACTION_TYPES.map((a) => (
                <option key={a} value={a}>{formatLabel(a)}</option>
              ))}
            </FormSelect>
          </div>

          {/* Dynamic config fields based on action type */}
          {(actionType === 'send_email' || actionType === 'send_slack') && (
            <>
              {actionType === 'send_email' && (
                <div>
                  <FormLabel>Subject</FormLabel>
                  <FormInput
                    type="text"
                    value={actionConfig.subject ?? ''}
                    onChange={(e) => setActionConfig((p) => ({ ...p, subject: e.target.value }))}
                    placeholder="e.g. Task Updated: {{title}}"
                  />
                </div>
              )}
              <div>
                <FormLabel>{actionType === 'send_email' ? 'Body' : 'Message'}</FormLabel>
                <FormTextarea
                  value={actionConfig.body ?? actionConfig.message ?? ''}
                  onChange={(e) =>
                    setActionConfig((p) => ({
                      ...p,
                      [actionType === 'send_email' ? 'body' : 'message']: e.target.value,
                    }))
                  }
                  rows={3}
                  placeholder="Use {{variable}} for dynamic values"
                />
              </div>
            </>
          )}

          {actionType === 'create_task' && (
            <div>
              <FormLabel>Task Title</FormLabel>
              <FormInput
                type="text"
                value={actionConfig.title ?? ''}
                onChange={(e) => setActionConfig((p) => ({ ...p, title: e.target.value }))}
                placeholder="e.g. Follow up: {{proposal_name}}"
              />
            </div>
          )}

          {actionType === 'update_status' && (
            <>
              <div>
                <FormLabel>Entity Type</FormLabel>
                <FormInput
                  type="text"
                  value={actionConfig.entity_type ?? ''}
                  onChange={(e) => setActionConfig((p) => ({ ...p, entity_type: e.target.value }))}
                  placeholder="e.g. tasks, proposals"
                />
              </div>
              <div>
                <FormLabel>New Status</FormLabel>
                <FormInput
                  type="text"
                  value={actionConfig.new_status ?? ''}
                  onChange={(e) => setActionConfig((p) => ({ ...p, new_status: e.target.value }))}
                  placeholder="e.g. done, approved"
                />
              </div>
            </>
          )}

          {actionType === 'webhook' && (
            <div>
              <FormLabel>Webhook URL</FormLabel>
              <FormInput
                type="url"
                value={actionConfig.url ?? ''}
                onChange={(e) => setActionConfig((p) => ({ ...p, url: e.target.value }))}
                placeholder="https://hooks.example.com/webhook"
              />
            </div>
          )}

          <div className="flex justify-between">
            <Button variant="secondary" onClick={() => setStep('conditions')}>← Back</Button>
            <Button onClick={() => setStep('review')}>Review →</Button>
          </div>
        </div>
      )}

      {step === 'review' && (
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-bg-secondary/30 p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 rounded-full bg-purple-100 text-purple-700 px-3 py-1 text-xs font-medium">
                <Zap size={12} /> When
              </div>
              <span className="text-sm text-foreground">{formatLabel(triggerType)}</span>
            </div>

            {conditions.length > 0 && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 rounded-full bg-amber-100 text-amber-700 px-3 py-1 text-xs font-medium">
                  <Filter size={12} /> If
                </div>
                <div className="text-sm text-text-secondary">
                  {conditions
                    .filter((c) => c.field)
                    .map((c) => `${c.field} ${c.operator} ${c.value}`)
                    .join(' AND ')}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 rounded-full bg-green-100 text-green-700 px-3 py-1 text-xs font-medium">
                <Play size={12} /> Then
              </div>
              <span className="text-sm text-foreground">{formatLabel(actionType)}</span>
            </div>
          </div>

          <div className="flex justify-between">
            <Button variant="secondary" onClick={() => setStep('action')}>← Back</Button>
            <Button onClick={handleSubmit} loading={submitting}>
              {submitting ? 'Creating…' : 'Create Automation'}
            </Button>
          </div>
        </div>
      )}
    </ModalShell>
  );
}
