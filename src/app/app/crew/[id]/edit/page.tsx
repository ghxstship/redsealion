'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import FormInput from '@/components/ui/FormInput';
import FormLabel from '@/components/ui/FormLabel';

interface EditCrewProfileProps {
  params: Promise<{ id: string }>;
}

export default function EditCrewProfilePage({ params }: EditCrewProfileProps) {
  const router = useRouter();
  const [profileId, setProfileId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [dayRate, setDayRate] = useState('');
  const [skills, setSkills] = useState('');
  const [availabilityDefault, setAvailabilityDefault] = useState('available');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');

  useEffect(() => {
    (async () => {
      const { id } = await params;
      setProfileId(id);
      const supabase = createClient();
      const { data } = await supabase
        .from('crew_profiles')
        .select('*, users(full_name)')
        .eq('id', id)
        .single();

      if (data) {
        const userRec = data.users as Record<string, string> | null;
        setFullName(data.full_name || userRec?.full_name || '');
        setBio(data.bio || '');
        setPhone(data.phone || '');
        setHourlyRate(data.hourly_rate?.toString() || '');
        setDayRate(data.day_rate?.toString() || '');
        setSkills(Array.isArray(data.skills) ? data.skills.join(', ') : '');
        setAvailabilityDefault(data.availability_default || 'available');
        setEmergencyContactName(data.emergency_contact_name || '');
        setEmergencyContactPhone(data.emergency_contact_phone || '');
      }
      setLoading(false);
    })();
  }, [params]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/crew/${profileId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          bio: bio || null,
          phone: phone || null,
          hourly_rate: hourlyRate ? Number(hourlyRate) : null,
          day_rate: dayRate ? Number(dayRate) : null,
          skills: skills.split(',').map((s) => s.trim()).filter(Boolean),
          availability_default: availabilityDefault,
          availability_status: availabilityDefault,
          emergency_contact_name: emergencyContactName || null,
          emergency_contact_phone: emergencyContactPhone || null,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? 'Failed to save');
      } else {
        router.push(`/app/crew/${profileId}`);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={() => router.back()}
        className="text-xs font-medium text-text-muted hover:text-foreground transition-colors mb-4 inline-block"
      >
        &larr; Back
      </button>

      <h1 className="text-lg font-semibold text-foreground mb-6">Edit Crew Profile</h1>

      {error && <Alert className="mb-4">{error}</Alert>}

      <div className="space-y-4 bg-background border border-border rounded-xl p-6">
        <div>
          <FormLabel>Full Name</FormLabel>
          <FormInput value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div>
          <FormLabel>Bio</FormLabel>
          <textarea
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
        </div>
        <div>
          <FormLabel>Phone</FormLabel>
          <FormInput value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <FormLabel>Hourly Rate ($)</FormLabel>
            <FormInput type="number" step="0.01" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} />
          </div>
          <div>
            <FormLabel>Day Rate ($)</FormLabel>
            <FormInput type="number" step="0.01" value={dayRate} onChange={(e) => setDayRate(e.target.value)} />
          </div>
        </div>
        <div>
          <FormLabel>Skills (comma-separated)</FormLabel>
          <FormInput value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="Lighting, Audio, Rigging" />
        </div>
        <div>
          <FormLabel>Default Availability</FormLabel>
          <select
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
            value={availabilityDefault}
            onChange={(e) => setAvailabilityDefault(e.target.value)}
          >
            <option value="available">Available</option>
            <option value="tentative">Tentative</option>
            <option value="unavailable">Unavailable</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <FormLabel>Emergency Contact Name</FormLabel>
            <FormInput value={emergencyContactName} onChange={(e) => setEmergencyContactName(e.target.value)} />
          </div>
          <div>
            <FormLabel>Emergency Contact Phone</FormLabel>
            <FormInput value={emergencyContactPhone} onChange={(e) => setEmergencyContactPhone(e.target.value)} />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-foreground transition-colors"
          >
            Cancel
          </button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}
