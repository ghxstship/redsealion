'use client';

import type { Address, VenueActivationDates, VenueLoadInStrike } from '@/types/database';
import VenueCard from './VenueCard';

export type { VenueData } from './VenueCard';
import type { VenueData } from './VenueCard';
import { IconPlus } from '@/components/ui/Icons';

interface VenueStepProps {
  venues: VenueData[];
  onChange: (venues: VenueData[]) => void;
}

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
        <IconPlus size={16} />
        Add Venue
      </button>
    </div>
  );
}
