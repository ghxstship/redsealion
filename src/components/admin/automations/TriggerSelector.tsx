'use client';

import { useState } from 'react';
import FormSelect from '@/components/ui/FormSelect';
import FormInput from '@/components/ui/FormInput';
import FormLabel from '@/components/ui/FormLabel';

const TRIGGER_TYPES = [
  { value: 'proposal_status_change', label: 'Proposal Status Change', description: 'Fires when a proposal status changes' },
  { value: 'proposal_follow_up', label: 'Proposal Follow-Up', description: 'Fires when a sent proposal has no response after a delay' },
  { value: 'proposal_viewed_no_action', label: 'Proposal Viewed (No Action)', description: 'Fires when a proposal is viewed but not approved' },
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
      <FormLabel>
        Trigger Event
      </FormLabel>
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
          <FormLabel>
            When status changes to:
          </FormLabel>
          <FormSelect
            value={(config.targetStatus as string) ?? ''}
            onChange={(e) => onChange(selectedType, { ...config, targetStatus: e.target.value })}
          >
            <option value="">Any status</option>
            <option value="sent">Sent</option>
            <option value="approved">Approved</option>
            <option value="in_production">In Production</option>
            <option value="complete">Complete</option>
            <option value="cancelled">Cancelled</option>
          </FormSelect>
        </div>
      )}

      {(selectedType === 'proposal_follow_up' || selectedType === 'proposal_viewed_no_action') && (
        <div className="mt-3 space-y-3">
          <div>
            <FormLabel>
              Follow-up Cadence
            </FormLabel>
            <div className="flex gap-2">
              {[1, 3, 7, 14].map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => onChange(selectedType, { ...config, delayDays: days })}
                  className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                    (config.delayDays as number) === days
                      ? 'border-foreground bg-foreground text-white'
                      : 'border-border bg-white text-foreground hover:bg-bg-secondary'
                  }`}
                >
                  {days} {days === 1 ? 'day' : 'days'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <FormLabel>
              Max follow-ups per proposal
            </FormLabel>
            <FormSelect
              value={(config.maxFollowUps as number) ?? 3}
              onChange={(e) => onChange(selectedType, { ...config, maxFollowUps: Number(e.target.value) })}
            >
              <option value={1}>1 follow-up</option>
              <option value={2}>2 follow-ups</option>
              <option value={3}>3 follow-ups</option>
              <option value={5}>5 follow-ups</option>
            </FormSelect>
          </div>
        </div>
      )}

      {selectedType === 'schedule' && (
        <div className="mt-3">
          <FormLabel>
            Cron Expression
          </FormLabel>
          <FormInput
            type="text"
            value={(config.cron as string) ?? ''}
            onChange={(e) => onChange(selectedType, { ...config, cron: e.target.value })}
            placeholder="0 9 * * 1 (every Monday at 9 AM)" />
        </div>
      )}
    </div>
  );
}
