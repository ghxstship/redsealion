'use client';

import { useState } from 'react';
import FormSelect from '@/components/ui/FormSelect';
import FormInput from '@/components/ui/FormInput';
import FormLabel from '@/components/ui/FormLabel';
import { TRIGGER_TYPES } from '@/lib/automations/constants';
import Button from '@/components/ui/Button';

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
          <Button
            key={trigger.value}
            type="button"
            onClick={() => handleTypeChange(trigger.value)}
            className={`rounded-lg border px-4 py-3 text-left transition-colors ${
              selectedType === trigger.value
                ? 'border-foreground bg-bg-secondary'
                : 'border-border bg-background hover:bg-bg-secondary'
            }`}
          >
            <p className="text-sm font-medium text-foreground">{trigger.label}</p>
            <p className="mt-0.5 text-xs text-text-muted">{trigger.description}</p>
          </Button>
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
                <Button
                  key={days}
                  type="button"
                  onClick={() => onChange(selectedType, { ...config, delayDays: days })}
                  className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                    (config.delayDays as number) === days
                      ? 'border-foreground bg-foreground text-white'
                      : 'border-border bg-background text-foreground hover:bg-bg-secondary'
                  }`}
                >
                  {days} {days === 1 ? 'day' : 'days'}
                </Button>
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
