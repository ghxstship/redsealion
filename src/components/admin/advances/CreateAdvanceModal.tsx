'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import FormInput from '@/components/ui/FormInput';
import FormLabel from '@/components/ui/FormLabel';
import FormSelect from '@/components/ui/FormSelect';
import FormTextarea from '@/components/ui/FormTextarea';
import ModalShell from '@/components/ui/ModalShell';
import AdvanceModeSwitcher from './AdvanceModeSwitcher';
import { ADVANCE_TYPE_CONFIG } from '@/lib/advances/constants';
import type { AdvanceMode, AdvanceType, AdvancePriority } from '@/types/database';

interface CreateAdvanceModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateAdvanceModal({ open, onClose, onCreated }: CreateAdvanceModalProps) {
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<AdvanceMode>('internal');
  const [advanceType, setAdvanceType] = useState<AdvanceType>('production');
  const [priority, setPriority] = useState<AdvancePriority>('medium');
  const [eventName, setEventName] = useState('');
  const [venueName, setVenueName] = useState('');
  const [purpose, setPurpose] = useState('');
  const [serviceStart, setServiceStart] = useState('');
  const [serviceEnd, setServiceEnd] = useState('');
  const [loadIn, setLoadIn] = useState('');
  const [strikeDate, setStrikeDate] = useState('');
  const [submissionDeadline, setSubmissionDeadline] = useState('');
  const [instructions, setInstructions] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/advances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          advance_mode: mode,
          advance_type: advanceType,
          priority,
          event_name: eventName || undefined,
          venue_name: venueName || undefined,
          purpose: purpose || undefined,
          service_start_date: serviceStart || undefined,
          service_end_date: serviceEnd || undefined,
          load_in_date: loadIn || undefined,
          strike_date: strikeDate || undefined,
          submission_deadline: submissionDeadline || undefined,
          submission_instructions: instructions || undefined,
        }),
      });
      if (res.ok) {
        onCreated();
      }
    } finally {
      setLoading(false);
    }
  }

  const typeEntries = Object.entries(ADVANCE_TYPE_CONFIG) as Array<[AdvanceType, { label: string }]>;

  return (
    <ModalShell open={open} onClose={onClose} title="New Advance" subtitle="Create a new production advance" size="lg" sectioned>
      <form onSubmit={handleSubmit} className="divide-y divide-border">
        {/* Mode Selection */}
        <div className="px-5 py-4">
          <FormLabel>Mode</FormLabel>
          <AdvanceModeSwitcher value={mode} onChange={setMode} />
        </div>

        {/* Classification */}
        <div className="px-5 py-4 grid grid-cols-2 gap-4">
          <div>
            <FormLabel htmlFor="advance-type">Type</FormLabel>
            <FormSelect id="advance-type" value={advanceType} onChange={(e) => setAdvanceType(e.target.value as AdvanceType)}>
              {typeEntries.map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </FormSelect>
          </div>
          <div>
            <FormLabel htmlFor="advance-priority">Priority</FormLabel>
            <FormSelect id="advance-priority" value={priority} onChange={(e) => setPriority(e.target.value as AdvancePriority)}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </FormSelect>
          </div>
        </div>

        {/* Context */}
        <div className="px-5 py-4 space-y-3">
          <div>
            <FormLabel htmlFor="event-name">Event Name</FormLabel>
            <FormInput id="event-name" value={eventName} onChange={(e) => setEventName(e.target.value)} placeholder="e.g., Summer Music Festival 2026" />
          </div>
          <div>
            <FormLabel htmlFor="venue-name">Venue</FormLabel>
            <FormInput id="venue-name" value={venueName} onChange={(e) => setVenueName(e.target.value)} placeholder="e.g., Madison Square Garden" />
          </div>
          <div>
            <FormLabel htmlFor="purpose">Purpose / Description</FormLabel>
            <FormTextarea id="purpose" value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="Brief description of what this advance covers..." rows={3} />
          </div>
        </div>

        {/* Dates */}
        <div className="px-5 py-4 grid grid-cols-2 gap-4">
          <div>
            <FormLabel htmlFor="service-start">Service Start</FormLabel>
            <FormInput id="service-start" type="date" value={serviceStart} onChange={(e) => setServiceStart(e.target.value)} />
          </div>
          <div>
            <FormLabel htmlFor="service-end">Service End</FormLabel>
            <FormInput id="service-end" type="date" value={serviceEnd} onChange={(e) => setServiceEnd(e.target.value)} />
          </div>
          <div>
            <FormLabel htmlFor="load-in">Load In</FormLabel>
            <FormInput id="load-in" type="date" value={loadIn} onChange={(e) => setLoadIn(e.target.value)} />
          </div>
          <div>
            <FormLabel htmlFor="strike-date">Strike</FormLabel>
            <FormInput id="strike-date" type="date" value={strikeDate} onChange={(e) => setStrikeDate(e.target.value)} />
          </div>
        </div>

        {/* Collection mode extras */}
        {mode === 'collection' && (
          <div className="px-5 py-4 space-y-3">
            <div>
              <FormLabel htmlFor="submission-deadline">Submission Deadline</FormLabel>
              <FormInput id="submission-deadline" type="datetime-local" value={submissionDeadline} onChange={(e) => setSubmissionDeadline(e.target.value)} />
            </div>
            <div>
              <FormLabel htmlFor="instructions">Submission Instructions</FormLabel>
              <FormTextarea id="instructions" value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="Instructions for collaborators..." rows={3} />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-5 py-4 flex justify-end gap-3">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>Create Advance</Button>
        </div>
      </form>
    </ModalShell>
  );
}
