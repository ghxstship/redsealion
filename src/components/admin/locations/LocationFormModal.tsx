'use client';

import { useState, useEffect, type FormEvent } from 'react';
import ModalShell from '@/components/ui/ModalShell';
import FormLabel from '@/components/ui/FormLabel';
import FormInput from '@/components/ui/FormInput';
import FormSelect from '@/components/ui/FormSelect';
import FormTextarea from '@/components/ui/FormTextarea';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

interface LocationFormModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  location?: Record<string, unknown> | null;
}

type LocationAddress = {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
};

const LOCATION_TYPES = [
  'venue', 'arena', 'stadium', 'convention_center', 'hotel', 'outdoor',
  'warehouse', 'office', 'studio', 'restaurant', 'virtual', 'other',
] as const;

function formatLabel(s: string): string {
  return s.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export default function LocationFormModal({ open, onClose, onCreated, location }: LocationFormModalProps) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [type, setType] = useState<string>('venue');
  const [phone, setPhone] = useState('');
  const [timezone, setTimezone] = useState('');
  const [capacity, setCapacity] = useState('');
  const [siteMapUrl, setSiteMapUrl] = useState('');
  const [notes, setNotes] = useState('');

  // Address fields
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [country, setCountry] = useState('');

  // Google Maps fields
  const [googlePlaceId, setGooglePlaceId] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = !!location?.id;

  // Prefill form when editing
  useEffect(() => {
    if (open && location) {
      const address = (location.address as LocationAddress | undefined) ?? {};
      setName((location.name as string) || '');
      setSlug((location.slug as string) || '');
      setType((location.type as string) || 'venue');
      setPhone((location.phone as string) || '');
      setTimezone((location.timezone as string) || '');
      setCapacity(location.capacity ? String(location.capacity) : '');
      setSiteMapUrl((location.site_map_url as string) || '');
      setNotes((location.notes as string) || '');
      
      setStreet((location.address_line1 as string) || address.street || '');
      setCity((location.city as string) || address.city || '');
      setState((location.state_province as string) || address.state || '');
      setZip((location.postal_code as string) || address.zip || '');
      setCountry((location.country as string) || address.country || '');

      setGooglePlaceId((location.google_place_id as string) || '');
      setLatitude(location.latitude ? String(location.latitude) : '');
      setLongitude(location.longitude ? String(location.longitude) : '');
    } else if (open && !location) {
      resetForm();
    }
  }, [open, location]);

  function resetForm() {
    setName(''); setSlug(''); setType('venue'); setPhone(''); setTimezone('');
    setCapacity(''); setSiteMapUrl(''); setNotes('');
    setStreet(''); setCity(''); setState(''); setZip(''); setCountry('');
    setGooglePlaceId(''); setLatitude(''); setLongitude('');
    setError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const address: Record<string, string> = {};
    if (street) address.street = street;
    if (city) address.city = city;
    if (state) address.state = state;
    if (zip) address.zip = zip;
    if (country) address.country = country;

    const formatted = [street, city, state, zip, country].filter(Boolean).join(', ');

    try {
      const url = isEdit ? `/api/locations/${location.id}` : '/api/locations';
      const method = isEdit ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          slug: slug || undefined,
          type,
          address: Object.keys(address).length ? address : {},
          address_line1: street || null,
          city: city || null,
          state_province: state || null,
          postal_code: zip || null,
          country: country || 'US',
          formatted_address: formatted || null,
          phone: phone || null,
          timezone: timezone || null,
          capacity: capacity ? parseInt(capacity) : null,
          site_map_url: siteMapUrl || null,
          google_place_id: googlePlaceId || null,
          latitude: latitude ? parseFloat(latitude) : null,
          longitude: longitude ? parseFloat(longitude) : null,
          notes: notes || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed to ${isEdit ? 'update' : 'create'} location`);
      }

      resetForm();
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  }

  const isVirtual = type === 'virtual';

  return (
    <ModalShell open={open} onClose={onClose} title={isEdit ? "Edit Location" : "Add Location"} size="xl">
      {error && <Alert className="mb-4">{error}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <FormLabel>Location Name *</FormLabel>
            <FormInput type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Madison Square Garden" />
          </div>
          <div>
            <FormLabel>Slug</FormLabel>
            <FormInput type="text" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="Auto-generated if empty" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <FormLabel>Type</FormLabel>
            <FormSelect value={type} onChange={(e) => setType(e.target.value)}>
              {LOCATION_TYPES.map(t => <option key={t} value={t}>{formatLabel(t)}</option>)}
            </FormSelect>
          </div>
          <div>
            <FormLabel>Phone</FormLabel>
            <FormInput type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (212) 465-6741" />
          </div>
        </div>

        {!isVirtual && (
          <>
            {/* Address block */}
            <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Address</p>
            <div>
              <FormLabel>Street</FormLabel>
              <FormInput type="text" value={street} onChange={(e) => setStreet(e.target.value)} placeholder="4 Pennsylvania Plaza" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <FormLabel>City</FormLabel>
                <FormInput type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="New York" />
              </div>
              <div>
                <FormLabel>State</FormLabel>
                <FormInput type="text" value={state} onChange={(e) => setState(e.target.value)} placeholder="NY" />
              </div>
              <div>
                <FormLabel>Zip</FormLabel>
                <FormInput type="text" value={zip} onChange={(e) => setZip(e.target.value)} placeholder="10001" />
              </div>
            </div>
            <div>
              <FormLabel>Country</FormLabel>
              <FormInput type="text" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="United States" />
            </div>

            {/* Google Maps / Geo */}
            <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mt-4">Google Maps Integration</p>
            <div>
              <FormLabel>Google Place ID</FormLabel>
              <FormInput type="text" value={googlePlaceId} onChange={(e) => setGooglePlaceId(e.target.value)} placeholder="ChIJhRwB-yFawokR5Phil-QQ3zM" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FormLabel>Latitude</FormLabel>
                <FormInput type="number" step="0.0000001" value={latitude} onChange={(e) => setLatitude(e.target.value)} placeholder="40.7505045" />
              </div>
              <div>
                <FormLabel>Longitude</FormLabel>
                <FormInput type="number" step="0.0000001" value={longitude} onChange={(e) => setLongitude(e.target.value)} placeholder="-73.9934387" />
              </div>
            </div>
          </>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <FormLabel>Capacity</FormLabel>
            <FormInput type="number" min="0" value={capacity} onChange={(e) => setCapacity(e.target.value)} placeholder="20,000" />
          </div>
          <div>
            <FormLabel>Timezone</FormLabel>
            <FormInput type="text" value={timezone} onChange={(e) => setTimezone(e.target.value)} placeholder="America/New_York" />
          </div>
        </div>

        <div>
          <FormLabel>Site Map URL</FormLabel>
          <FormInput type="url" value={siteMapUrl} onChange={(e) => setSiteMapUrl(e.target.value)} placeholder="https://..." />
        </div>

        <div>
          <FormLabel>Notes</FormLabel>
          <FormTextarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Any additional details..." />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={submitting}>
            {submitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Location'}
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}
