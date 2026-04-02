'use client';

import { useState } from 'react';
import type { Address, VenueActivationDates, VenueLoadInStrike } from '@/types/database';

export interface VenueData {
  id: string;
  name: string;
  address: Address;
  type: string;
  activationDates: VenueActivationDates | null;
  loadIn: VenueLoadInStrike | null;
  strike: VenueLoadInStrike | null;
  hasLoadIn: boolean;
  hasStrike: boolean;
  notes: string;
}

interface VenueStepProps {
  venues: VenueData[];
  onChange: (venues: VenueData[]) => void;
}

const VENUE_TYPE_SUGGESTIONS = [
  'Convention Center',
  'Hotel Ballroom',
  'Outdoor Festival',
  'Retail Space',
  'Pop-Up',
  'Arena',
  'Warehouse',
  'Rooftop',
  'Gallery',
  'Restaurant',
];

function createEmptyVenue(): VenueData {
  return {
    id: crypto.randomUUID(),
    name: '',
    address: { street: '', city: '', state: '', zip: '', country: 'US' },
    type: '',
    activationDates: { start: '', end: '' },
    loadIn: null,
    strike: null,
    hasLoadIn: false,
    hasStrike: false,
    notes: '',
  };
}

function VenueCard({
  venue,
  index,
  onUpdate,
  onRemove,
}: {
  venue: VenueData;
  index: number;
  onUpdate: (venue: VenueData) => void;
  onRemove: () => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [showTypeSuggestions, setShowTypeSuggestions] = useState(false);

  const updateAddress = (partial: Partial<Address>) => {
    onUpdate({ ...venue, address: { ...venue.address, ...partial } });
  };

  const filteredSuggestions = VENUE_TYPE_SUGGESTIONS.filter((s) =>
    s.toLowerCase().includes(venue.type.toLowerCase())
  );

  return (
    <div className="rounded-xl border border-border bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border">
        <button
          type="button"
          className="flex items-center gap-2 text-sm font-medium text-foreground"
          onClick={() => setExpanded(!expanded)}
        >
          <svg
            className={`h-4 w-4 text-text-muted transition-transform ${expanded ? 'rotate-90' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
          Venue {index + 1}{venue.name ? `: ${venue.name}` : ''}
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="text-xs text-text-muted hover:text-error"
        >
          Remove
        </button>
      </div>

      {/* Body */}
      {expanded && (
        <div className="px-5 py-4 space-y-4">
          {/* Name & Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">
                Venue Name
              </label>
              <input
                type="text"
                placeholder="e.g., Austin Convention Center"
                value={venue.name}
                onChange={(e) => onUpdate({ ...venue, name: e.target.value })}
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground placeholder:text-text-muted focus:border-org-primary focus:outline-none focus:ring-1 focus:ring-org-primary"
              />
            </div>
            <div className="relative">
              <label className="block text-xs font-medium text-text-secondary mb-1">
                Venue Type
              </label>
              <input
                type="text"
                placeholder="e.g., Convention Center"
                value={venue.type}
                onChange={(e) => {
                  onUpdate({ ...venue, type: e.target.value });
                  setShowTypeSuggestions(true);
                }}
                onFocus={() => setShowTypeSuggestions(true)}
                onBlur={() => setTimeout(() => setShowTypeSuggestions(false), 150)}
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground placeholder:text-text-muted focus:border-org-primary focus:outline-none focus:ring-1 focus:ring-org-primary"
              />
              {showTypeSuggestions && venue.type && filteredSuggestions.length > 0 && (
                <ul className="absolute z-10 mt-1 w-full rounded-lg border border-border bg-white shadow-sm max-h-32 overflow-y-auto">
                  {filteredSuggestions.map((s) => (
                    <li key={s}>
                      <button
                        type="button"
                        className="w-full px-3 py-1.5 text-left text-sm hover:bg-bg-secondary"
                        onMouseDown={() => {
                          onUpdate({ ...venue, type: s });
                          setShowTypeSuggestions(false);
                        }}
                      >
                        {s}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Street</label>
            <input
              type="text"
              value={venue.address.street ?? ''}
              onChange={(e) => updateAddress({ street: e.target.value })}
              className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground placeholder:text-text-muted focus:border-org-primary focus:outline-none focus:ring-1 focus:ring-org-primary"
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">City</label>
              <input
                type="text"
                value={venue.address.city ?? ''}
                onChange={(e) => updateAddress({ city: e.target.value })}
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground focus:border-org-primary focus:outline-none focus:ring-1 focus:ring-org-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">State</label>
              <input
                type="text"
                value={venue.address.state ?? ''}
                onChange={(e) => updateAddress({ state: e.target.value })}
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground focus:border-org-primary focus:outline-none focus:ring-1 focus:ring-org-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">ZIP</label>
              <input
                type="text"
                value={venue.address.zip ?? ''}
                onChange={(e) => updateAddress({ zip: e.target.value })}
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground focus:border-org-primary focus:outline-none focus:ring-1 focus:ring-org-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Country</label>
              <input
                type="text"
                value={venue.address.country ?? 'US'}
                onChange={(e) => updateAddress({ country: e.target.value })}
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground focus:border-org-primary focus:outline-none focus:ring-1 focus:ring-org-primary"
              />
            </div>
          </div>

          {/* Activation Dates */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Activation Start</label>
              <input
                type="date"
                value={venue.activationDates?.start ?? ''}
                onChange={(e) =>
                  onUpdate({
                    ...venue,
                    activationDates: {
                      start: e.target.value,
                      end: venue.activationDates?.end ?? '',
                    },
                  })
                }
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground focus:border-org-primary focus:outline-none focus:ring-1 focus:ring-org-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Activation End</label>
              <input
                type="date"
                value={venue.activationDates?.end ?? ''}
                onChange={(e) =>
                  onUpdate({
                    ...venue,
                    activationDates: {
                      start: venue.activationDates?.start ?? '',
                      end: e.target.value,
                    },
                  })
                }
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground focus:border-org-primary focus:outline-none focus:ring-1 focus:ring-org-primary"
              />
            </div>
          </div>

          {/* Constraint toggles */}
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
              <input
                type="checkbox"
                checked={venue.hasLoadIn}
                onChange={(e) =>
                  onUpdate({
                    ...venue,
                    hasLoadIn: e.target.checked,
                    loadIn: e.target.checked
                      ? { date: '', startTime: '', endTime: '' }
                      : null,
                  })
                }
                className="rounded border-border text-org-primary focus:ring-org-primary"
              />
              Load-In Window
            </label>
            <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
              <input
                type="checkbox"
                checked={venue.hasStrike}
                onChange={(e) =>
                  onUpdate({
                    ...venue,
                    hasStrike: e.target.checked,
                    strike: e.target.checked
                      ? { date: '', startTime: '', endTime: '' }
                      : null,
                  })
                }
                className="rounded border-border text-org-primary focus:ring-org-primary"
              />
              Strike Window
            </label>
          </div>

          {/* Load-In fields */}
          {venue.hasLoadIn && venue.loadIn && (
            <div className="grid grid-cols-1 gap-4 pl-4 border-l-2 border-border sm:grid-cols-3">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Load-In Date</label>
                <input
                  type="date"
                  value={venue.loadIn.date}
                  onChange={(e) =>
                    onUpdate({
                      ...venue,
                      loadIn: { ...venue.loadIn!, date: e.target.value },
                    })
                  }
                  className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground focus:border-org-primary focus:outline-none focus:ring-1 focus:ring-org-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Start Time</label>
                <input
                  type="time"
                  value={venue.loadIn.startTime}
                  onChange={(e) =>
                    onUpdate({
                      ...venue,
                      loadIn: { ...venue.loadIn!, startTime: e.target.value },
                    })
                  }
                  className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground focus:border-org-primary focus:outline-none focus:ring-1 focus:ring-org-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">End Time</label>
                <input
                  type="time"
                  value={venue.loadIn.endTime}
                  onChange={(e) =>
                    onUpdate({
                      ...venue,
                      loadIn: { ...venue.loadIn!, endTime: e.target.value },
                    })
                  }
                  className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground focus:border-org-primary focus:outline-none focus:ring-1 focus:ring-org-primary"
                />
              </div>
            </div>
          )}

          {/* Strike fields */}
          {venue.hasStrike && venue.strike && (
            <div className="grid grid-cols-1 gap-4 pl-4 border-l-2 border-border sm:grid-cols-3">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Strike Date</label>
                <input
                  type="date"
                  value={venue.strike.date}
                  onChange={(e) =>
                    onUpdate({
                      ...venue,
                      strike: { ...venue.strike!, date: e.target.value },
                    })
                  }
                  className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground focus:border-org-primary focus:outline-none focus:ring-1 focus:ring-org-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Start Time</label>
                <input
                  type="time"
                  value={venue.strike.startTime}
                  onChange={(e) =>
                    onUpdate({
                      ...venue,
                      strike: { ...venue.strike!, startTime: e.target.value },
                    })
                  }
                  className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground focus:border-org-primary focus:outline-none focus:ring-1 focus:ring-org-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">End Time</label>
                <input
                  type="time"
                  value={venue.strike.endTime}
                  onChange={(e) =>
                    onUpdate({
                      ...venue,
                      strike: { ...venue.strike!, endTime: e.target.value },
                    })
                  }
                  className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground focus:border-org-primary focus:outline-none focus:ring-1 focus:ring-org-primary"
                />
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Notes</label>
            <textarea
              rows={2}
              value={venue.notes}
              onChange={(e) => onUpdate({ ...venue, notes: e.target.value })}
              placeholder="Parking, loading dock info, restrictions..."
              className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground placeholder:text-text-muted focus:border-org-primary focus:outline-none focus:ring-1 focus:ring-org-primary resize-none"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function VenueStep({ venues, onChange }: VenueStepProps) {
  const addVenue = () => {
    onChange([...venues, createEmptyVenue()]);
  };

  const updateVenue = (index: number, venue: VenueData) => {
    const updated = [...venues];
    updated[index] = venue;
    onChange(updated);
  };

  const removeVenue = (index: number) => {
    onChange(venues.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Venues</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Add the venues and locations for this project.
        </p>
      </div>

      {venues.length === 0 && (
        <div className="rounded-xl border border-dashed border-border py-12 text-center">
          <p className="text-sm text-text-muted">No venues added yet.</p>
        </div>
      )}

      <div className="space-y-4">
        {venues.map((venue, index) => (
          <VenueCard
            key={venue.id}
            venue={venue}
            index={index}
            onUpdate={(v) => updateVenue(index, v)}
            onRemove={() => removeVenue(index)}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={addVenue}
        className="inline-flex items-center gap-2 rounded-lg border border-dashed border-border px-4 py-2 text-sm font-medium text-text-secondary hover:border-org-primary hover:text-org-primary transition-colors"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Add Venue
      </button>
    </div>
  );
}
