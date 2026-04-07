'use client';

import { useState } from 'react';
import FormSelect from '@/components/ui/FormSelect';
import FormTextarea from '@/components/ui/FormTextarea';
import FormInput from '@/components/ui/FormInput';
import FormLabel from '@/components/ui/FormLabel';

const ACTION_TYPES = [
  { value: 'send_email', label: 'Send Email', description: 'Send an email notification' },
  { value: 'send_follow_up_email', label: 'Send Follow-Up Email', description: 'Send a proposal follow-up nudge to the client' },
  { value: 'send_review_request', label: 'Request Review', description: 'Ask the client for a review after project completion' },
  { value: 'send_slack', label: 'Send Slack Message', description: 'Post a message to a Slack channel' },
  { value: 'create_invoice', label: 'Create Invoice', description: 'Auto-generate an invoice' },
  { value: 'update_deal_stage', label: 'Update Deal Stage', description: 'Move a deal to a different stage' },
  { value: 'create_task', label: 'Create Task', description: 'Create a task in a connected PM tool' },
  { value: 'sync_crm', label: 'Sync to CRM', description: 'Push data to connected CRM' },
  { value: 'webhook_call', label: 'Call Webhook', description: 'Send data to an external URL' },
  { value: 'create_calendar_event', label: 'Create Calendar Event', description: 'Add event to connected calendar' },
];

interface ActionSelectorProps {
  value: string;
  config: Record<string, unknown>;
  onChange: (actionType: string, config: Record<string, unknown>) => void;
}

export function ActionSelector({ value, config, onChange }: ActionSelectorProps) {
  const [selectedType, setSelectedType] = useState(value);

  function handleTypeChange(newType: string) {
    setSelectedType(newType);
    onChange(newType, {});
  }

  return (
    <div className="space-y-4">
      <FormLabel>
        Action
      </FormLabel>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {ACTION_TYPES.map((action) => (
          <button
            key={action.value}
            type="button"
            onClick={() => handleTypeChange(action.value)}
            className={`rounded-lg border px-4 py-3 text-left transition-colors ${
              selectedType === action.value
                ? 'border-foreground bg-bg-secondary'
                : 'border-border bg-white hover:bg-bg-secondary'
            }`}
          >
            <p className="text-sm font-medium text-foreground">{action.label}</p>
            <p className="mt-0.5 text-xs text-text-muted">{action.description}</p>
          </button>
        ))}
      </div>

      {selectedType === 'send_email' && (
        <div className="mt-3 space-y-2">
          <div>
            <FormLabel>To</FormLabel>
            <FormInput
              type="text"
              value={(config.to as string) ?? ''}
              onChange={(e) => onChange(selectedType, { ...config, to: e.target.value })}
              placeholder="recipient@example.com" />
          </div>
          <div>
            <FormLabel>Subject</FormLabel>
            <FormInput
              type="text"
              value={(config.subject as string) ?? ''}
              onChange={(e) => onChange(selectedType, { ...config, subject: e.target.value })}
              placeholder="Notification subject" />
          </div>
          <div>
            <FormLabel>Body</FormLabel>
            <FormTextarea
              value={(config.body as string) ?? ''}
              onChange={(e) => onChange(selectedType, { ...config, body: e.target.value })}
              rows={3}
              placeholder="Email body..."
            />
          </div>
        </div>
      )}

      {selectedType === 'webhook_call' && (
        <div className="mt-3">
          <FormLabel>Webhook URL</FormLabel>
          <FormInput
            type="url"
            value={(config.url as string) ?? ''}
            onChange={(e) => onChange(selectedType, { ...config, url: e.target.value })}
            placeholder="https://example.com/webhook" />
        </div>
      )}

      {selectedType === 'send_slack' && (
        <div className="mt-3">
          <FormLabel>Channel</FormLabel>
          <FormInput
            type="text"
            value={(config.channel as string) ?? ''}
            onChange={(e) => onChange(selectedType, { ...config, channel: e.target.value })}
            placeholder="#general" />
        </div>
      )}

      {selectedType === 'send_follow_up_email' && (
        <div className="mt-3 space-y-2">
          <div>
            <FormLabel>Email Template</FormLabel>
            <FormSelect
              value={(config.template as string) ?? 'gentle_reminder'}
              onChange={(e) => onChange(selectedType, { ...config, template: e.target.value })}
            >
              <option value="gentle_reminder">Gentle Reminder</option>
              <option value="value_highlight">Value Highlight</option>
              <option value="urgency_close">Urgency Close</option>
              <option value="custom">Custom</option>
            </FormSelect>
          </div>
          {(config.template as string) === 'custom' && (
            <div>
              <FormLabel>Custom Subject</FormLabel>
              <FormInput
                type="text"
                value={(config.subject as string) ?? ''}
                onChange={(e) => onChange(selectedType, { ...config, subject: e.target.value })}
                placeholder="Following up on your proposal" />
            </div>
          )}
          <div className="rounded-lg border border-border bg-bg-secondary/50 p-3">
            <p className="text-xs text-text-muted">
              <strong>Available variables:</strong> {'{client_name}'}, {'{proposal_name}'}, {'{proposal_value}'}, {'{portal_link}'}
            </p>
          </div>
        </div>
      )}

      {selectedType === 'send_review_request' && (
        <div className="mt-3 space-y-2">
          <div>
            <FormLabel>Review Platform URL</FormLabel>
            <FormInput
              type="url"
              value={(config.reviewUrl as string) ?? ''}
              onChange={(e) => onChange(selectedType, { ...config, reviewUrl: e.target.value })}
              placeholder="https://g.page/your-business/review" />
          </div>
          <div>
            <FormLabel>Delay After Completion</FormLabel>
            <FormSelect
              value={(config.delayDays as number) ?? 1}
              onChange={(e) => onChange(selectedType, { ...config, delayDays: Number(e.target.value) })}
            >
              <option value={0}>Immediately</option>
              <option value={1}>1 day</option>
              <option value={3}>3 days</option>
              <option value={7}>7 days</option>
            </FormSelect>
          </div>
        </div>
      )}
    </div>
  );
}
