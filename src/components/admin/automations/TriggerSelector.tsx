'use client';

import { useState } from 'react';

const TRIGGER_TYPES = [
  { value: 'proposal_status_change', label: 'Proposal Status Change', description: 'Fires when a proposal status changes' },
  { value: 'deal_stage_change', label: 'Deal Stage Change', description: 'Fires when a deal moves to a new stage' },
  { value: 'invoice_paid', label: 'Invoice Paid', description: 'Fires when an invoice is fully paid' },
  { value: 'invoice_overdue', label: 'Invoice Overdue', description: 'Fires when an invoice passes its due date' },
  { value: 'milestone_completed', label: 'Milestone Completed', description: 'Fires when a milestone gate is completed' },
  { value: 'client_created', label: 'Client Created', description: 'Fires when a new client is added' },
  { value: 'proposal_approved', label: 'Proposal Approved', description: 'Fires when a proposal is approved by the client' },
  { value: 'schedule', label: 'Scheduled', description: 'Fires on a recurring schedule (cron)' },
  { value: 'webhook_received', label: 'Webhook Received', description: 'Fires when a webhook event is received' },
];

interface TriggerSelectorProps {
  value: string;
  config: Record<string, unknown>;
  onChange: (triggerType: string, config: Record<string, unknown>) => void;
}

export function TriggerSelector({ value, config, onChange }: TriggerSelectorProps) {
  const [selectedType, setSelectedType] = useState(value);

  function handleTypeChange(newType: string) {
    setSelectedType(newType);
    onChange(newType, {});
  }

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-foreground">
        Trigger Event
      </label>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {TRIGGER_TYPES.map((trigger) => (
          <button
            key={trigger.value}
            type="button"
            onClick={() => handleTypeChange(trigger.value)}
            className={`rounded-lg border px-4 py-3 text-left transition-colors ${
              selectedType === trigger.value
                ? 'border-foreground bg-bg-secondary'
                : 'border-border bg-white hover:bg-bg-secondary'
            }`}
          >
            <p className="text-sm font-medium text-foreground">{trigger.label}</p>
            <p className="mt-0.5 text-xs text-text-muted">{trigger.description}</p>
          </button>
        ))}
      </div>

      {selectedType === 'proposal_status_change' && (
        <div className="mt-3">
          <label className="block text-xs font-medium text-text-secondary mb-1">
            When status changes to:
          </label>
          <select
            value={(config.targetStatus as string) ?? ''}
            onChange={(e) => onChange(selectedType, { ...config, targetStatus: e.target.value })}
            className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-foreground"
          >
            <option value="">Any status</option>
            <option value="sent">Sent</option>
            <option value="approved">Approved</option>
            <option value="in_production">In Production</option>
            <option value="complete">Complete</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      )}

      {selectedType === 'schedule' && (
        <div className="mt-3">
          <label className="block text-xs font-medium text-text-secondary mb-1">
            Cron Expression
          </label>
          <input
            type="text"
            value={(config.cron as string) ?? ''}
            onChange={(e) => onChange(selectedType, { ...config, cron: e.target.value })}
            placeholder="0 9 * * 1 (every Monday at 9 AM)"
            className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-foreground"
          />
        </div>
      )}
    </div>
  );
}
