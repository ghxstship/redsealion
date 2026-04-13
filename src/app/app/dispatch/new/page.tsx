'use client';

import FormInput from '@/components/ui/FormInput';
import Checkbox from '@/components/ui/Checkbox';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import FormSelect from '@/components/ui/FormSelect';
import FormTextarea from '@/components/ui/FormTextarea';

const PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;

interface CrewOption {
  id: string;
  full_name: string;
}

interface EventOption {
  id: string;
  name: string;
}

interface ProposalOption {
  id: string;
  name: string;
}

export default function NewWorkOrderPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<string>('medium');
  const [locationName, setLocationName] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const [scheduledStart, setScheduledStart] = useState('');
  const [scheduledEnd, setScheduledEnd] = useState('');

  // Crew selection
  const [crewOptions, setCrewOptions] = useState<CrewOption[]>([]);
  const [selectedCrew, setSelectedCrew] = useState<string[]>([]);
  const [crewLoading, setCrewLoading] = useState(true);

  // Event/Proposal linking
  const [eventOptions, setEventOptions] = useState<EventOption[]>([]);
  const [proposalOptions, setProposalOptions] = useState<ProposalOption[]>([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [selectedProposal, setSelectedProposal] = useState('');

  // Checklist
  const [checklistItems, setChecklistItems] = useState<string[]>([]);
  const [newChecklistItem, setNewChecklistItem] = useState('');

  useEffect(() => {
    // Fetch crew options
    fetch('/api/crew')
      .then((res) => res.json())
      .then((body) => {
        const crew = (body.crew ?? body.crew_profiles ?? []) as Array<{ id: string; full_name: string }>;
        setCrewOptions(crew.map((c) => ({ id: c.id, full_name: c.full_name })));
      })
      .catch(() => {})
      .finally(() => setCrewLoading(false));

    // Fetch events
    fetch('/api/events')
      .then((res) => res.json())
      .then((body) => {
        const events = (body.events ?? []) as Array<{ id: string; name: string }>;
        setEventOptions(events);
      })
      .catch(() => {});

    // Fetch proposals
    fetch('/api/proposals')
      .then((res) => res.json())
      .then((body) => {
        const proposals = (body.proposals ?? []) as Array<{ id: string; name: string }>;
        setProposalOptions(proposals);
      })
      .catch(() => {});
  }, []);

  function toggleCrew(crewId: string) {
    setSelectedCrew((prev) =>
      prev.includes(crewId) ? prev.filter((id) => id !== crewId) : [...prev, crewId]
    );
  }

  function addChecklistItem() {
    if (newChecklistItem.trim()) {
      setChecklistItems((prev) => [...prev, newChecklistItem.trim()]);
      setNewChecklistItem('');
    }
  }

  function removeChecklistItem(index: number) {
    setChecklistItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/work-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          priority,
          location_name: locationName.trim() || undefined,
          location_address: locationAddress.trim() || undefined,
          scheduled_start: scheduledStart || undefined,
          scheduled_end: scheduledEnd || undefined,
          crew_ids: selectedCrew.length > 0 ? selectedCrew : undefined,
          proposal_id: selectedProposal || undefined,
          checklist: checklistItems.length > 0
            ? checklistItems.map((text) => ({ text, done: false }))
            : undefined,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: 'Unknown error' }));
        setError(body.error ?? 'Failed to create work order.');
        return;
      }

      router.push('/app/dispatch');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <TierGate feature="work_orders">
      <PageHeader
        title="New Work Order"
        subtitle="Create a work order and dispatch it to your crew."
      />

      {error && (
        <Alert variant="error">{error}</Alert>
      )}

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <Card>
          <h2 className="text-sm font-semibold text-foreground mb-5">Details</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="wo-title" className="block text-sm font-medium text-foreground mb-1.5">
                Title <span className="text-red-500">*</span>
              </label>
              <FormInput
                id="wo-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="e.g. Stage build at Javits Center"
                className="w-full rounded-lg border border-border bg-card px-3.5 py-2 text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20"
              />
            </div>

            <div>
              <label htmlFor="wo-desc" className="block text-sm font-medium text-foreground mb-1.5">
                Description
              </label>
              <FormTextarea
                id="wo-desc"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the work to be done..."
                className="w-full rounded-lg border border-border bg-card px-3.5 py-2 text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20 resize-none"
              />
            </div>

            <div>
              <label htmlFor="wo-priority" className="block text-sm font-medium text-foreground mb-1.5">
                Priority
              </label>
              <FormSelect
                id="wo-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full rounded-lg border border-border bg-card px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </option>
                ))}
              </FormSelect>
            </div>
          </div>
        </Card>

        {/* Crew Assignment */}
        <Card>
          <h2 className="text-sm font-semibold text-foreground mb-5">Assign Crew</h2>
          {crewLoading ? (
            <div className="py-4 text-sm text-text-muted">Loading crew...</div>
          ) : crewOptions.length === 0 ? (
            <div className="py-4 text-sm text-text-secondary">
              No crew members available. <Link href="/app/crew" className="text-foreground hover:underline">Add crew</Link> first.
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {crewOptions.map((crew) => (
                <label
                  key={crew.id}
                  className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors ${
                    selectedCrew.includes(crew.id)
                      ? 'border-foreground/30 bg-bg-secondary'
                      : 'border-border hover:border-foreground/10'
                  }`}
                >
                  <Checkbox
                    checked={selectedCrew.includes(crew.id)}
                    onChange={() => toggleCrew(crew.id)}
                    size="md"
                  />
                  <span className="text-sm text-foreground">{crew.full_name}</span>
                </label>
              ))}
            </div>
          )}
          {selectedCrew.length > 0 && (
            <p className="mt-3 text-xs text-text-muted">{selectedCrew.length} crew member{selectedCrew.length > 1 ? 's' : ''} selected</p>
          )}
        </Card>

        {/* Location */}
        <Card>
          <h2 className="text-sm font-semibold text-foreground mb-5">Location</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="wo-loc-name" className="block text-sm font-medium text-foreground mb-1.5">
                Venue / Site Name
              </label>
              <FormInput
                id="wo-loc-name"
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="e.g. Javits Convention Center"
                className="w-full rounded-lg border border-border bg-card px-3.5 py-2 text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20"
              />
            </div>
            <div>
              <label htmlFor="wo-loc-addr" className="block text-sm font-medium text-foreground mb-1.5">
                Address
              </label>
              <FormInput
                id="wo-loc-addr"
                type="text"
                value={locationAddress}
                onChange={(e) => setLocationAddress(e.target.value)}
                placeholder="429 11th Ave, New York, NY 10001"
                className="w-full rounded-lg border border-border bg-card px-3.5 py-2 text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20"
              />
            </div>
          </div>
        </Card>

        {/* Schedule */}
        <Card>
          <h2 className="text-sm font-semibold text-foreground mb-5">Schedule</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="wo-start" className="block text-sm font-medium text-foreground mb-1.5">
                Start
              </label>
              <FormInput
                id="wo-start"
                type="datetime-local"
                value={scheduledStart}
                onChange={(e) => setScheduledStart(e.target.value)}
                className="w-full rounded-lg border border-border bg-card px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20"
              />
            </div>
            <div>
              <label htmlFor="wo-end" className="block text-sm font-medium text-foreground mb-1.5">
                End
              </label>
              <FormInput
                id="wo-end"
                type="datetime-local"
                value={scheduledEnd}
                onChange={(e) => setScheduledEnd(e.target.value)}
                className="w-full rounded-lg border border-border bg-card px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20"
              />
            </div>
          </div>
        </Card>

        {/* Linked Records */}
        {(eventOptions.length > 0 || proposalOptions.length > 0) && (
          <Card>
            <h2 className="text-sm font-semibold text-foreground mb-5">Link to Record</h2>
            <div className="space-y-4">
              {eventOptions.length > 0 && (
                <div>
                  <label htmlFor="wo-event" className="block text-sm font-medium text-foreground mb-1.5">Event</label>
                  <FormSelect
                    id="wo-event"
                    value={selectedEvent}
                    onChange={(e) => setSelectedEvent(e.target.value)}
                    className="w-full rounded-lg border border-border bg-card px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20"
                  >
                    <option value="">None</option>
                    {eventOptions.map((ev) => (
                      <option key={ev.id} value={ev.id}>{ev.name}</option>
                    ))}
                  </FormSelect>
                </div>
              )}
              {proposalOptions.length > 0 && (
                <div>
                  <label htmlFor="wo-proposal" className="block text-sm font-medium text-foreground mb-1.5">Proposal</label>
                  <FormSelect
                    id="wo-proposal"
                    value={selectedProposal}
                    onChange={(e) => setSelectedProposal(e.target.value)}
                    className="w-full rounded-lg border border-border bg-card px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20"
                  >
                    <option value="">None</option>
                    {proposalOptions.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </FormSelect>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Checklist Builder */}
        <Card>
          <h2 className="text-sm font-semibold text-foreground mb-5">Checklist</h2>
          {checklistItems.length > 0 && (
            <ul className="space-y-2 mb-4">
              {checklistItems.map((item, i) => (
                <li key={i} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
                  <span className="h-4 w-4 rounded border border-border flex items-center justify-center text-xs text-text-muted" />
                  <span className="flex-1 text-sm text-foreground">{item}</span>
                  <Button
                    type="button"
                    onClick={() => removeChecklistItem(i)}
                    className="text-xs text-text-muted hover:text-red-600 transition-colors"
                  >
                    ✕
                  </Button>
                </li>
              ))}
            </ul>
          )}
          <div className="flex gap-2">
            <FormInput
              type="text"
              value={newChecklistItem}
              onChange={(e) => setNewChecklistItem(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addChecklistItem(); } }}
              placeholder="Add checklist item..."
              className="flex-1 rounded-lg border border-border bg-card px-3.5 py-2 text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20"
            />
            <Button type="button" variant="secondary" onClick={addChecklistItem} disabled={!newChecklistItem.trim()}>
              Add
            </Button>
          </div>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push('/app/dispatch')}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={saving || !title.trim()}>
            {saving ? 'Creating...' : 'Create Work Order'}
          </Button>
        </div>
      </form>
    </TierGate>
  );
}
