'use client';

import React, { useState } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Alert from '@/components/ui/Alert';
import FormSelect from '@/components/ui/FormSelect';
import FormInput from '@/components/ui/FormInput';
import FormLabel from '@/components/ui/FormLabel';

interface ShipmentFormProps {
  onCreated: () => void;
  onClose: () => void;
  defaultDirection: 'inbound' | 'outbound';
}

export default function ShipmentForm({ onCreated, onClose, defaultDirection }: ShipmentFormProps) {
  const [direction, setDirection] = useState<'inbound' | 'outbound'>(defaultDirection);
  const [shipmentMethod, setShipmentMethod] = useState('');
  const [carrier, setCarrier] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/shipments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          direction,
          shipment_method: shipmentMethod || null,
          carrier: carrier || null,
          tracking_number: trackingNumber || null,
          status: 'pending',
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.message ?? 'Failed to create shipment.');
      } else {
        onCreated();
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-foreground">Create Shipment</h2>
        <button onClick={onClose} className="text-text-muted hover:text-foreground text-lg leading-none">
          &times;
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert className="mb-4">{error}</Alert>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <FormLabel>Direction</FormLabel>
            <FormSelect
              value={direction}
              onChange={(e) => setDirection(e.target.value as 'inbound' | 'outbound')}
              required
            >
              <option value="outbound">Outbound</option>
              <option value="inbound">Inbound</option>
            </FormSelect>
          </div>
          <div>
            <FormLabel>Method</FormLabel>
            <FormSelect
              value={shipmentMethod}
              onChange={(e) => setShipmentMethod(e.target.value)}
            >
              <option value="">Select Method</option>
              <option value="freight">Freight</option>
              <option value="parcel">Parcel</option>
              <option value="courier">Courier</option>
              <option value="pickup">Pickup</option>
            </FormSelect>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <FormLabel>Carrier</FormLabel>
            <FormInput
              value={carrier}
              onChange={(e) => setCarrier(e.target.value)}
              placeholder="e.g., FedEx, UPS"
            />
          </div>
          <div>
            <FormLabel>Tracking Number</FormLabel>
            <FormInput
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="Tracking #"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Creating...' : 'Create Shipment'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
