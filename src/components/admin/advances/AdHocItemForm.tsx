'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import FormInput from '@/components/ui/FormInput';
import FormLabel from '@/components/ui/FormLabel';
import FormSelect from '@/components/ui/FormSelect';
import FormTextarea from '@/components/ui/FormTextarea';

/**
 * Ad-hoc line item form for items not in the catalog.
 *
 * Gap: H-17 — Items like "Gold Carts - 6 PAX" or "Pallet Water" that
 * don't exist in the catalog could not be entered.
 */

interface AdHocItemFormProps {
  onAdd: (item: Record<string, unknown>) => void;
  onBack: () => void;
}

export default function AdHocItemForm({ onAdd, onBack }: AdHocItemFormProps) {
  const [itemName, setItemName] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('day');
  const [unitPriceDollars, setUnitPriceDollars] = useState('');
  const [serviceStart, setServiceStart] = useState('');
  const [serviceEnd, setServiceEnd] = useState('');
  const [notes, setNotes] = useState('');
  const [makeModel, setMakeModel] = useState('');
  const [isExisting, setIsExisting] = useState(false);
  const [isTentative, setIsTentative] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!itemName.trim()) return;

    const unitPriceCents = unitPriceDollars ? Math.round(parseFloat(unitPriceDollars) * 100) : null;

    onAdd({
      item_name: itemName.trim(),
      item_description: description.trim() || undefined,
      quantity,
      unit_of_measure: unit,
      unit_price_cents: unitPriceCents,
      service_start_date: serviceStart || undefined,
      service_end_date: serviceEnd || undefined,
      notes: notes.trim() || undefined,
      make_model: makeModel.trim() || undefined,
      is_existing: isExisting,
      is_tentative: isTentative,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <FormLabel htmlFor="adhoc-name">Item Name *</FormLabel>
        <FormInput
          id="adhoc-name"
          value={itemName}
          onChange={(e) => setItemName(e.target.value)}
          placeholder="e.g., Gold Cart - 6 PAX"
          required
        />
      </div>

      <div>
        <FormLabel htmlFor="adhoc-desc">Description</FormLabel>
        <FormTextarea
          id="adhoc-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional details about the item..."
          rows={2}
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <FormLabel htmlFor="adhoc-qty">Quantity</FormLabel>
          <FormInput
            id="adhoc-qty"
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
          />
        </div>
        <div>
          <FormLabel htmlFor="adhoc-unit">Unit</FormLabel>
          <FormSelect id="adhoc-unit" value={unit} onChange={(e) => setUnit(e.target.value)}>
            <option value="day">Day</option>
            <option value="week">Week</option>
            <option value="show">Show</option>
            <option value="event">Event</option>
            <option value="each">Each</option>
            <option value="flat">Flat Rate</option>
            <option value="hour">Hour</option>
            <option value="shift">Shift</option>
          </FormSelect>
        </div>
        <div>
          <FormLabel htmlFor="adhoc-price">Unit Price ($)</FormLabel>
          <FormInput
            id="adhoc-price"
            type="number"
            step="0.01"
            min={0}
            value={unitPriceDollars}
            onChange={(e) => setUnitPriceDollars(e.target.value)}
            placeholder="0.00"
          />
        </div>
      </div>

      <div>
        <FormLabel htmlFor="adhoc-model">Make / Model</FormLabel>
        <FormInput
          id="adhoc-model"
          value={makeModel}
          onChange={(e) => setMakeModel(e.target.value)}
          placeholder="e.g., JCB 535-95 or similar"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <FormLabel htmlFor="adhoc-start">Service Start</FormLabel>
          <FormInput id="adhoc-start" type="date" value={serviceStart} onChange={(e) => setServiceStart(e.target.value)} />
        </div>
        <div>
          <FormLabel htmlFor="adhoc-end">Service End</FormLabel>
          <FormInput id="adhoc-end" type="date" value={serviceEnd} onChange={(e) => setServiceEnd(e.target.value)} />
        </div>
      </div>

      <div>
        <FormLabel htmlFor="adhoc-notes">Notes</FormLabel>
        <FormTextarea
          id="adhoc-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Special requirements, specifications..."
          rows={2}
        />
      </div>

      <div className="flex gap-4">
        <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
          <input type="checkbox" checked={isExisting} onChange={(e) => setIsExisting(e.target.checked)} className="rounded border-border" />
          Existing on-site
        </label>
        <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
          <input type="checkbox" checked={isTentative} onChange={(e) => setIsTentative(e.target.checked)} className="rounded border-border" />
          Tentative (TBC)
        </label>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onBack}>← Back</Button>
        <Button type="submit" disabled={!itemName.trim()}>Add to Advance</Button>
      </div>
    </form>
  );
}
