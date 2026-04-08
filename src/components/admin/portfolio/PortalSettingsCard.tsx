'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import FormInput from '@/components/ui/FormInput';
import FormTextarea from '@/components/ui/FormTextarea';
import Tabs from '@/components/ui/Tabs';
import Alert from '@/components/ui/Alert';
import type { Database } from '@/types/database';

type PortalType = Database['public']['Enums']['portal_type'];

const PORTAL_TYPES: { key: PortalType; label: string }[] = [
  { key: 'production', label: 'Production' },
  { key: 'operations', label: 'Operations' },
  { key: 'food_beverage', label: 'Food & Beverage' },
  { key: 'talent', label: 'Talent & Industry' },
  { key: 'guest', label: 'Guests' },
  { key: 'temporary', label: 'Temporary Access' },
];

export function PortalSettingsCard({ projectId }: { projectId: string }) {
  const [activeTab, setActiveTab] = useState<PortalType>('production');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [data, setData] = useState<Partial<Database['public']['Tables']['project_portals']['Row']>>({});
  const [message, setMessage] = useState('');

  const supabase = createClient();

  useEffect(() => {
    async function loadPortal() {
      setIsLoading(true);
      const { data: portal, error } = await supabase
        .from('project_portals')
        .select('*')
        .eq('project_id', projectId)
        .eq('portal_type', activeTab)
        .maybeSingle();

      if (portal) {
        setData(portal);
      } else {
        setData({
          project_id: projectId,
          portal_type: activeTab,
          is_published: false,
          call_time: '',
          parking_instructions: '',
          rideshare_instructions: '',
          transit_instructions: '',
        });
      }
      setIsLoading(false);
    }
    loadPortal();
  }, [projectId, activeTab, supabase]);

  const handleSave = async () => {
    setIsSaving(true);
    setMessage('');
    try {
      const payload = {
        ...data,
      } as Database['public']['Tables']['project_portals']['Insert'];

      if (data.id) {
        // Update existing
        await supabase.from('project_portals').update(payload).eq('id', data.id);
      } else {
        // Find org_id from project
        const { data: project } = await supabase.from('projects').select('organization_id').eq('id', projectId).single();
        if (project) {
          payload.organization_id = project.organization_id;
          const { data: inserted } = await supabase.from('project_portals').insert(payload).select().single();
          if (inserted) {
            setData(inserted);
          }
        }
      }
      setMessage('Portal settings saved successfully.');
    } catch {
      setMessage('Failed to save portal settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const activeLabel = PORTAL_TYPES.find(t => t.key === activeTab)?.label || 'Portal';

  return (
    <div className="bg-white border rounded-lg shadow-sm p-6 lg:col-span-2">
      <h2 className="text-lg font-semibold mb-4 text-gray-900">Event Portal Configuration</h2>
      <p className="text-sm text-gray-500 mb-6">
        Manage the Know Before You Go information served to productionsite.guide for this specific project.
      </p>
      
      <Tabs tabs={PORTAL_TYPES} activeTab={activeTab} onTabChange={(key) => setActiveTab(key as PortalType)} />

      <div className="space-y-6 pt-4 mt-6">
        {isLoading ? (
          <div className="text-sm text-gray-500">Loading portal data...</div>
        ) : (
          <>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_published"
                checked={data.is_published || false}
                onChange={(e) => setData({ ...data, is_published: e.target.checked })}
              />
              <label htmlFor="is_published" className="text-sm font-medium">
                Publish this portal publicly
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Call Time / Doors Time</label>
              <FormInput
                value={data.call_time || ''}
                onChange={(e) => setData({ ...data, call_time: e.target.value })}
                placeholder="e.g. 3:00 PM — Saturday, March 28"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Parking Instructions</label>
                <FormTextarea
                  value={data.parking_instructions || ''}
                  onChange={(e) => setData({ ...data, parking_instructions: e.target.value })}
                  placeholder="Zone B via E 4th Ave..."
                  rows={4}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rideshare Instructions</label>
                <FormTextarea
                  value={data.rideshare_instructions || ''}
                  onChange={(e) => setData({ ...data, rideshare_instructions: e.target.value })}
                  placeholder="Rideshare loop on E 32nd St..."
                  rows={4}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transit Instructions</label>
                <FormTextarea
                  value={data.transit_instructions || ''}
                  onChange={(e) => setData({ ...data, transit_instructions: e.target.value })}
                  placeholder="MetroRail Green Line..."
                  rows={4}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Check-In Instructions</label>
                <FormTextarea
                  value={data.check_in_instructions || ''}
                  onChange={(e) => setData({ ...data, check_in_instructions: e.target.value })}
                  placeholder="Proceed to Staff Check-in..."
                  rows={4}
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={handleSave} loading={isSaving} className="w-full sm:w-auto">
                {isSaving ? 'Saving...' : `Save ${activeLabel} Portal`}
              </Button>
            </div>

            {message && (
              <Alert variant="info">{message}</Alert>
            )}
          </>
        )}
      </div>
    </div>
  );
}
