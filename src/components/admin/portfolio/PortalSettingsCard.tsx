'use client';

/**
 * Portal settings card — manages project portal configuration.
 * Uses the /api/project-portals API routes instead of direct Supabase client.
 * Addresses GAP-P17 (API-based) and GAP-P32 (pre-arrival, FAQ, amenity editors).
 */

import { useState, useEffect, useCallback } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import FormInput from '@/components/ui/FormInput';
import FormTextarea from '@/components/ui/FormTextarea';
import Tabs from '@/components/ui/Tabs';
import Alert from '@/components/ui/Alert';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { Plus, Trash2 } from 'lucide-react';
import type { Database } from '@/types/database';
import { WAYFINDING_PLACEHOLDERS } from '@/lib/constants/placeholders';

type PortalType = Database['public']['Enums']['portal_type'];

interface FaqEntry { q: string; a: string; }
interface ChecklistItem { text: string; completed: boolean; }

const PORTAL_TYPES: { key: PortalType; label: string }[] = [
  { key: 'production', label: 'Production' },
  { key: 'operations', label: 'Operations' },
  { key: 'food_beverage', label: 'Food & Beverage' },
  { key: 'talent', label: 'Talent & Industry' },
  { key: 'guest', label: 'Guests' },
  { key: 'temporary', label: 'Temporary Access' },
];

interface PortalData {
  id?: string;
  project_id: string;
  portal_type: PortalType;
  organization_id?: string;
  is_published: boolean;
  call_time: string;
  parking_instructions: string;
  rideshare_instructions: string;
  transit_instructions: string;
  check_in_instructions: string;
  pre_arrival_checklist: ChecklistItem[];
  faqs: FaqEntry[];
  amenities: Record<string, boolean>;
}

const DEFAULT_AMENITIES = [
  'wifi', 'parking', 'catering', 'green_room', 'showers',
  'lockers', 'power_outlets', 'loading_dock', 'security',
];

export function PortalSettingsCard({ projectId }: { projectId: string }) {
  const [activeTab, setActiveTab] = useState<PortalType>('production');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [data, setData] = useState<PortalData>({
    project_id: projectId,
    portal_type: 'production',
    is_published: false,
    call_time: '',
    parking_instructions: '',
    rideshare_instructions: '',
    transit_instructions: '',
    check_in_instructions: '',
    pre_arrival_checklist: [],
    faqs: [],
    amenities: {},
  });
  const [message, setMessage] = useState('');
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);

  const loadPortal = useCallback(async () => {
    setIsLoading(true);
    setMessage('');
    try {
      const res = await fetch(`/api/project-portals?project_id=${projectId}&portal_type=${activeTab}`);
      if (res.ok) {
        const result = await res.json();
        const portals = result.portals ?? [];
        if (portals.length > 0) {
          const portal = portals[0];
          setData({
            id: portal.id,
            project_id: projectId,
            portal_type: activeTab,
            organization_id: portal.organization_id,
            is_published: portal.is_published ?? false,
            call_time: portal.call_time ?? '',
            parking_instructions: portal.parking_instructions ?? '',
            rideshare_instructions: portal.rideshare_instructions ?? '',
            transit_instructions: portal.transit_instructions ?? '',
            check_in_instructions: portal.check_in_instructions ?? '',
            pre_arrival_checklist: (portal.pre_arrival_checklist as ChecklistItem[]) ?? [],
            faqs: (portal.faqs as FaqEntry[]) ?? [],
            amenities: (portal.amenities as Record<string, boolean>) ?? {},
          });
        } else {
          setData({
            project_id: projectId,
            portal_type: activeTab,
            is_published: false,
            call_time: '',
            parking_instructions: '',
            rideshare_instructions: '',
            transit_instructions: '',
            check_in_instructions: '',
            pre_arrival_checklist: [],
            faqs: [],
            amenities: {},
          });
        }
      }
    } catch (err) {
      // GAP-PTL-31: Surface load errors to the user
      setMessage(err instanceof Error ? `Load error: ${err.message}` : 'Failed to load portal data.');
    }
    finally { setIsLoading(false); }
  }, [projectId, activeTab]);

  useEffect(() => { loadPortal(); }, [loadPortal]);

  const handleSave = async () => {
    setIsSaving(true);
    setMessage('');
    try {
      const payload = {
        is_published: data.is_published,
        call_time: data.call_time,
        parking_instructions: data.parking_instructions,
        rideshare_instructions: data.rideshare_instructions,
        transit_instructions: data.transit_instructions,
        check_in_instructions: data.check_in_instructions,
        pre_arrival_checklist: data.pre_arrival_checklist,
        faqs: data.faqs,
        amenities: data.amenities,
      };

      if (data.id) {
        // Update existing portal via API
        const res = await fetch(`/api/project-portals/${data.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          setMessage('Portal settings saved successfully.');
        } else {
          // GAP-PTL-31: Parse and display API error details
          const errData = await res.json().catch(() => ({}));
          setMessage(errData.error || `Failed to save (${res.status}).`);
        }
      } else {
        // Create new portal via API
        const res = await fetch('/api/project-portals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            project_id: projectId,
            portal_type: activeTab,
            ...payload,
          }),
        });
        if (res.ok) {
          const result = await res.json();
          if (result.portal) {
            setData((prev) => ({ ...prev, id: result.portal.id }));
          }
          setMessage('Portal created successfully.');
        } else {
          // GAP-PTL-31: Parse and display API error details
          const errData = await res.json().catch(() => ({}));
          setMessage(errData.error || `Failed to create portal (${res.status}).`);
        }
      }
    } catch (err) {
      // GAP-PTL-31: Surface create/update errors
      setMessage(err instanceof Error ? err.message : 'Failed to save portal settings.');
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Checklist helpers ─────────────────────────────
  function addChecklistItem() {
    setData((prev) => ({
      ...prev,
      pre_arrival_checklist: [...prev.pre_arrival_checklist, { text: '', completed: false }],
    }));
  }
  function updateChecklistItem(index: number, text: string) {
    setData((prev) => {
      const list = [...prev.pre_arrival_checklist];
      list[index] = { ...list[index], text };
      return { ...prev, pre_arrival_checklist: list };
    });
  }
  function removeChecklistItem(index: number) {
    setData((prev) => ({
      ...prev,
      pre_arrival_checklist: prev.pre_arrival_checklist.filter((_, i) => i !== index),
    }));
  }

  // ─── FAQ helpers ───────────────────────────────────
  function addFaq() {
    setData((prev) => ({
      ...prev,
      faqs: [...prev.faqs, { q: '', a: '' }],
    }));
  }
  function updateFaq(index: number, field: 'q' | 'a', value: string) {
    setData((prev) => {
      const list = [...prev.faqs];
      list[index] = { ...list[index], [field]: value };
      return { ...prev, faqs: list };
    });
  }
  function removeFaq(index: number) {
    setData((prev) => ({
      ...prev,
      faqs: prev.faqs.filter((_, i) => i !== index),
    }));
  }

  // ─── Amenity helpers ──────────────────────────────
  function toggleAmenity(key: string) {
    setData((prev) => ({
      ...prev,
      amenities: { ...prev.amenities, [key]: !prev.amenities[key] },
    }));
  }

  const activeLabel = PORTAL_TYPES.find(t => t.key === activeTab)?.label || 'Portal';

  return (
    <Card className="lg:col-span-2">
      <h2 className="text-lg font-semibold mb-4 text-foreground">Event Portal Configuration</h2>
      <p className="text-sm text-text-muted mb-6">
        Manage the Know Before You Go information served to productionsite.guide for this specific project.
      </p>
      
      <Tabs tabs={PORTAL_TYPES} activeTab={activeTab} onTabChange={(key) => setActiveTab(key as PortalType)} />

      <div className="space-y-6 pt-4 mt-6">
        {isLoading ? (
          <div className="text-sm text-text-muted">Loading portal data...</div>
        ) : (
          <>
            {/* Published toggle — GAP-PTL-17: with confirmation */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_published"
                checked={data.is_published || false}
                onChange={(e) => {
                  if (e.target.checked) {
                    // Show confirm dialog before publishing
                    setShowPublishConfirm(true);
                    return;
                  }
                  setData({ ...data, is_published: e.target.checked });
                }}
              />
              <label htmlFor="is_published" className="text-sm font-medium">
                Publish this portal publicly
              </label>
            </div>

            {/* Call time */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Call Time / Doors Time</label>
              <FormInput
                value={data.call_time || ''}
                onChange={(e) => setData({ ...data, call_time: e.target.value })}
                placeholder={WAYFINDING_PLACEHOLDERS.call_time}
              />
            </div>
            
            {/* Wayfinding instructions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Parking Instructions</label>
                <FormTextarea
                  value={data.parking_instructions || ''}
                  onChange={(e) => setData({ ...data, parking_instructions: e.target.value })}
                  placeholder={WAYFINDING_PLACEHOLDERS.parking}
                  rows={4}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Rideshare Instructions</label>
                <FormTextarea
                  value={data.rideshare_instructions || ''}
                  onChange={(e) => setData({ ...data, rideshare_instructions: e.target.value })}
                  placeholder={WAYFINDING_PLACEHOLDERS.rideshare}
                  rows={4}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Transit Instructions</label>
                <FormTextarea
                  value={data.transit_instructions || ''}
                  onChange={(e) => setData({ ...data, transit_instructions: e.target.value })}
                  placeholder={WAYFINDING_PLACEHOLDERS.transit}
                  rows={4}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Check-In Instructions</label>
                <FormTextarea
                  value={data.check_in_instructions || ''}
                  onChange={(e) => setData({ ...data, check_in_instructions: e.target.value })}
                  placeholder={WAYFINDING_PLACEHOLDERS.check_in}
                  rows={4}
                />
              </div>
            </div>

            {/* Pre-arrival checklist — GAP-P32 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-text-secondary">Pre-Arrival Checklist</label>
                <button onClick={addChecklistItem} className="text-xs font-medium text-text-muted hover:text-foreground flex items-center gap-1">
                  <Plus size={12} /> Add Item
                </button>
              </div>
              {data.pre_arrival_checklist.length === 0 ? (
                <p className="text-xs text-text-muted italic">No checklist items yet.</p>
              ) : (
                <div className="space-y-2">
                  {data.pre_arrival_checklist.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <FormInput
                        value={item.text}
                        onChange={(e) => updateChecklistItem(idx, e.target.value)}
                        placeholder={WAYFINDING_PLACEHOLDERS.checklist}
                        className="flex-1"
                      />
                      <button onClick={() => removeChecklistItem(idx)} className="text-text-muted hover:text-red-500 p-1">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* FAQs — GAP-P32 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-text-secondary">FAQs</label>
                <button onClick={addFaq} className="text-xs font-medium text-text-muted hover:text-foreground flex items-center gap-1">
                  <Plus size={12} /> Add FAQ
                </button>
              </div>
              {data.faqs.length === 0 ? (
                <p className="text-xs text-text-muted italic">No FAQs yet.</p>
              ) : (
                <div className="space-y-4">
                  {data.faqs.map((faq, idx) => (
                    <div key={idx} className="rounded-lg border border-border p-3 space-y-2">
                      <div className="flex items-start gap-2">
                        <div className="flex-1">
                          <FormInput
                            value={faq.q}
                            onChange={(e) => updateFaq(idx, 'q', e.target.value)}
                            placeholder={WAYFINDING_PLACEHOLDERS.faq_q}
                          />
                        </div>
                        <button onClick={() => removeFaq(idx)} className="text-text-muted hover:text-red-500 p-1 mt-1">
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <FormTextarea
                        value={faq.a}
                        onChange={(e) => updateFaq(idx, 'a', e.target.value)}
                        placeholder={WAYFINDING_PLACEHOLDERS.faq_a}
                        rows={2}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Amenities — GAP-P32 */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Amenities</label>
              <div className="flex flex-wrap gap-2">
                {DEFAULT_AMENITIES.map((amenity) => (
                  <button
                    key={amenity}
                    onClick={() => toggleAmenity(amenity)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors border ${
                      data.amenities[amenity]
                        ? 'bg-foreground text-background border-foreground'
                        : 'bg-bg-secondary text-text-secondary border-border hover:border-foreground/30'
                    }`}
                  >
                    {amenity.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                  </button>
                ))}
              </div>
            </div>

            {/* Save */}
            <div className="flex justify-end pt-4">
              <Button onClick={handleSave} loading={isSaving} className="w-full sm:w-auto">
                {isSaving ? 'Saving...' : `Save ${activeLabel} Portal`}
              </Button>
            </div>

            {message && (
              <Alert variant="info">{message}</Alert>
            )}

            <ConfirmDialog
              open={showPublishConfirm}
              title="Publish Portal"
              message={`Are you sure you want to publish the ${activeLabel} portal? This will make it publicly accessible via the production site.`}
              confirmLabel="Publish"
              onConfirm={() => {
                setData(prev => ({ ...prev, is_published: true }));
                setShowPublishConfirm(false);
              }}
              onCancel={() => setShowPublishConfirm(false)}
            />
          </>
        )}
      </div>
    </Card>
  );
}
