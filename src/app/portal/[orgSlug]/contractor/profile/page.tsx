'use client';

import { useState, useEffect, useCallback } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import FormInput from '@/components/ui/FormInput';
import FormTextarea from '@/components/ui/FormTextarea';
import Skeleton from '@/components/ui/Skeleton';
import { usePortalContext } from '@/components/portal/PortalContext';
import { toast } from 'react-hot-toast';

interface CrewProfile {
  display_name: string;
  phone: string | null;
  skills: string[];
  hourly_rate: number | null;
  bio: string | null;
  availability_status: string;
}

export default function ContractorProfilePage() {
  const { crewProfileId, orgSlug } = usePortalContext();
  const [profile, setProfile] = useState<CrewProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Editable fields
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState('');

  const loadProfile = useCallback(async () => {
    if (!crewProfileId) return;
    setLoading(true);
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { data } = await supabase
        .from('crew_profiles')
        .select('display_name, phone, skills, hourly_rate, bio, availability_status')
        .eq('id', crewProfileId)
        .single();

      if (data) {
        const p = data as CrewProfile;
        setProfile(p);
        setDisplayName(p.display_name ?? '');
        setPhone(p.phone ?? '');
        setHourlyRate(p.hourly_rate?.toString() ?? '');
        setBio(p.bio ?? '');
        setSkills(Array.isArray(p.skills) ? p.skills.join(', ') : '');
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, [crewProfileId]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (saving || !crewProfileId) return;
    setSaving(true);
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();

      const { error } = await supabase
        .from('crew_profiles')
        .update({
          display_name: displayName.trim(),
          phone: phone.trim() || null,
          hourly_rate: hourlyRate ? parseFloat(hourlyRate) : null,
          bio: bio.trim() || null,
          skills: skills.split(',').map(s => s.trim()).filter(Boolean),
        })
        .eq('id', crewProfileId);

      if (error) throw error;

      toast.success('Profile updated');
      loadProfile();
    } catch {
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="space-y-6">
        <PageHeader title="Profile" subtitle="Manage your contractor profile." />
        <Card>
          <p className="text-sm text-text-secondary text-center py-8">
            No crew profile found. Contact the organization admin to set up your profile.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Profile" subtitle="Update your contractor information." />

      <Card>
        <form onSubmit={saveProfile} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Display Name</label>
              <FormInput
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Phone</label>
              <FormInput
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">Hourly Rate ($)</label>
            <FormInput
              type="number"
              step="0.01"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
              placeholder="e.g. 75.00"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">Skills (comma-separated)</label>
            <FormInput
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="e.g. Lighting, Audio, Stage Setup"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">Bio</label>
            <FormTextarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell organizations about your experience..."
            />
          </div>

          {/* Status display */}
          <div className="border-t border-border pt-4">
            <p className="text-xs font-medium text-text-muted mb-1">Availability Status</p>
            <p className="text-sm font-medium text-foreground capitalize">
              {profile.availability_status?.replace(/_/g, ' ') ?? 'Available'}
            </p>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
