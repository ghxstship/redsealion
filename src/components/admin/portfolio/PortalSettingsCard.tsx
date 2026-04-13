'use client';

/**
 * Portal settings card — manages project portal configuration.
 * Uses the /api/project-portals API routes instead of direct Supabase client.
 * Addresses GAP-P17 (API-based) and GAP-P32 (pre-arrival, FAQ, amenity editors).
 * Extended for productionsite.guide completeness: route-in, safety rules,
 * emergency procedures, accessibility, crew intel, guest policies, etc.
 */

import { useState, useEffect, useCallback } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import FormInput from '@/components/ui/FormInput';
import FormTextarea from '@/components/ui/FormTextarea';
import Tabs from '@/components/ui/Tabs';
import Alert from '@/components/ui/Alert';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import type { Database } from '@/types/database';
import { WAYFINDING_PLACEHOLDERS } from '@/lib/constants/placeholders';

type PortalType = Database['public']['Enums']['portal_type'];

interface FaqEntry { q: string; a: string; }
interface ChecklistItem { text: string; completed: boolean; }
interface AmenityEntry { key: string; label: string; description: string; available: boolean; }
interface EmergencyProcedure { code: string; label: string; channel: string; steps: string[]; good_to_know: string; }
interface EvacuationInfo { assembly_point: string; ems_staging: string; instructions: string; }
interface AccessibilityItem { type: string; description: string; }
interface GuestPolicies { prohibited_items: string[]; bag_policy: string; re_entry_policy: string; age_requirements: string; dress_code: string; smoking_policy: string; }
interface ExternalLink { label: string; url: string; }
interface ArtistSocialLink { name: string; handle: string; url: string; }
interface SustainabilityItem { type: string; description: string; }

const PORTAL_TYPES: { key: PortalType; label: string }[] = [
  { key: 'production', label: 'Production' },
  { key: 'operations', label: 'Operations' },
  { key: 'food_beverage', label: 'Food \u0026 Beverage' },
  { key: 'talent', label: 'Talent \u0026 Industry' },
  { key: 'guest', label: 'Guests' },
  { key: 'temporary', label: 'Temporary Access' },
];

/** Portal types that show crew-specific sections */
const CREW_PORTALS: PortalType[] = ['production', 'operations', 'food_beverage'];
/** Portal types that show guest-specific sections */
const GUEST_PORTALS: PortalType[] = ['guest'];

interface PortalData {
  id?: string;
  project_id: string;
  portal_type: PortalType;
  organization_id?: string;
  is_published: boolean;
  description: string;
  call_time: string;
  route_in_instructions: string;
  parking_instructions: string;
  rideshare_instructions: string;
  transit_instructions: string;
  check_in_instructions: string;
  pre_arrival_checklist: ChecklistItem[];
  additional_notes: string[];
  radio_protocol: string;
  safety_rules: string[];
  emergency_procedures: EmergencyProcedure[];
  evacuation_info: EvacuationInfo;
  accessibility: AccessibilityItem[];
  faqs: FaqEntry[];
  crew_intel: FaqEntry[];
  amenities: AmenityEntry[];
  schedule: { artist: string; start_time: string; end_time: string }[];
  guest_policies: GuestPolicies;
  sustainability: SustainabilityItem[];
  external_links: ExternalLink[];
  artist_social_links: ArtistSocialLink[];
}

const DEFAULT_EVACUATION: EvacuationInfo = { assembly_point: '', ems_staging: '', instructions: '' };
const DEFAULT_GUEST_POLICIES: GuestPolicies = { prohibited_items: [], bag_policy: '', re_entry_policy: '', age_requirements: '', dress_code: '', smoking_policy: '' };

function emptyPortalData(projectId: string, portalType: PortalType): PortalData {
  return {
    project_id: projectId,
    portal_type: portalType,
    is_published: false,
    description: '',
    call_time: '',
    route_in_instructions: '',
    parking_instructions: '',
    rideshare_instructions: '',
    transit_instructions: '',
    check_in_instructions: '',
    pre_arrival_checklist: [],
    additional_notes: [],
    radio_protocol: '',
    safety_rules: [],
    emergency_procedures: [],
    evacuation_info: { ...DEFAULT_EVACUATION },
    accessibility: [],
    faqs: [],
    crew_intel: [],
    amenities: [],
    schedule: [],
    guest_policies: { ...DEFAULT_GUEST_POLICIES },
    sustainability: [],
    external_links: [],
    artist_social_links: [],
  };
}

// ─── Collapsible section ────────────────────────────────────────────────────

function Section({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-border rounded-lg">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-foreground hover:bg-bg-secondary/50 transition-colors rounded-lg"
      >
        {title}
        {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </button>
      {open && <div className="px-4 pb-4 space-y-4">{children}</div>}
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────

export function PortalSettingsCard({ projectId }: { projectId: string }) {
  const [activeTab, setActiveTab] = useState<PortalType>('production');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [data, setData] = useState<PortalData>(emptyPortalData(projectId, 'production'));
  const [message, setMessage] = useState('');
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);

  const isCrew = CREW_PORTALS.includes(activeTab);
  const isGuest = GUEST_PORTALS.includes(activeTab);

  // ─── Load ─────────────────────────────────────────────────────────────────

  const loadPortal = useCallback(async () => {
    setIsLoading(true);
    setMessage('');
    try {
      const res = await fetch(`/api/project-portals?project_id=${projectId}&portal_type=${activeTab}`);
      if (res.ok) {
        const result = await res.json();
        const portals = result.portals ?? [];
        if (portals.length > 0) {
          const p = portals[0];
          setData({
            id: p.id,
            project_id: projectId,
            portal_type: activeTab,
            organization_id: p.organization_id,
            is_published: p.is_published ?? false,
            description: p.description ?? '',
            call_time: p.call_time ?? '',
            route_in_instructions: p.route_in_instructions ?? '',
            parking_instructions: p.parking_instructions ?? '',
            rideshare_instructions: p.rideshare_instructions ?? '',
            transit_instructions: p.transit_instructions ?? '',
            check_in_instructions: p.check_in_instructions ?? '',
            pre_arrival_checklist: (p.pre_arrival_checklist as ChecklistItem[]) ?? [],
            additional_notes: (p.additional_notes as string[]) ?? [],
            radio_protocol: p.radio_protocol ?? '',
            safety_rules: (p.safety_rules as string[]) ?? [],
            emergency_procedures: (p.emergency_procedures as EmergencyProcedure[]) ?? [],
            evacuation_info: (p.evacuation_info as EvacuationInfo) ?? { ...DEFAULT_EVACUATION },
            accessibility: (p.accessibility as AccessibilityItem[]) ?? [],
            faqs: (p.faqs as FaqEntry[]) ?? [],
            crew_intel: (p.crew_intel as FaqEntry[]) ?? [],
            amenities: (p.amenities as AmenityEntry[]) ?? [],
            schedule: (p.schedule as { artist: string; start_time: string; end_time: string }[]) ?? [],
            guest_policies: (p.guest_policies as GuestPolicies) ?? { ...DEFAULT_GUEST_POLICIES },
            sustainability: (p.sustainability as SustainabilityItem[]) ?? [],
            external_links: (p.external_links as ExternalLink[]) ?? [],
            artist_social_links: (p.artist_social_links as ArtistSocialLink[]) ?? [],
          });
        } else {
          setData(emptyPortalData(projectId, activeTab));
        }
      }
    } catch (err) {
      setMessage(err instanceof Error ? `Load error: ${err.message}` : 'Failed to load portal data.');
    } finally {
      setIsLoading(false);
    }
  }, [projectId, activeTab]);

  useEffect(() => { loadPortal(); }, [loadPortal]);

  // ─── Save ─────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    setIsSaving(true);
    setMessage('');
    try {
      const payload = {
        is_published: data.is_published,
        description: data.description || null,
        call_time: data.call_time || null,
        route_in_instructions: data.route_in_instructions || null,
        parking_instructions: data.parking_instructions || null,
        rideshare_instructions: data.rideshare_instructions || null,
        transit_instructions: data.transit_instructions || null,
        check_in_instructions: data.check_in_instructions || null,
        pre_arrival_checklist: data.pre_arrival_checklist,
        additional_notes: data.additional_notes,
        radio_protocol: data.radio_protocol || null,
        safety_rules: data.safety_rules,
        emergency_procedures: data.emergency_procedures,
        evacuation_info: data.evacuation_info,
        accessibility: data.accessibility,
        faqs: data.faqs,
        crew_intel: data.crew_intel,
        amenities: data.amenities,
        schedule: data.schedule,
        guest_policies: data.guest_policies,
        sustainability: data.sustainability,
        external_links: data.external_links,
        artist_social_links: data.artist_social_links,
      };

      if (data.id) {
        const res = await fetch(`/api/project-portals/${data.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          setMessage('Portal settings saved successfully.');
        } else {
          const errData = await res.json().catch(() => ({}));
          setMessage(errData.error || `Failed to save (${res.status}).`);
        }
      } else {
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
          const errData = await res.json().catch(() => ({}));
          setMessage(errData.error || `Failed to create portal (${res.status}).`);
        }
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to save portal settings.');
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Generic list helpers ─────────────────────────────────────────────────

  function updateField<K extends keyof PortalData>(field: K, value: PortalData[K]) {
    setData((prev) => ({ ...prev, [field]: value }));
  }

  function addToList<T>(field: keyof PortalData, item: T) {
    setData((prev) => ({ ...prev, [field]: [...(prev[field] as T[]), item] }));
  }
  function updateInList<T>(field: keyof PortalData, index: number, item: T) {
    setData((prev) => {
      const list = [...(prev[field] as T[])];
      list[index] = item;
      return { ...prev, [field]: list };
    });
  }
  function removeFromList(field: keyof PortalData, index: number) {
    setData((prev) => ({
      ...prev,
      [field]: (prev[field] as unknown[]).filter((_, i) => i !== index),
    }));
  }

  const activeLabel = PORTAL_TYPES.find(t => t.key === activeTab)?.label || 'Portal';

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <Card className="lg:col-span-2">
      <h2 className="text-lg font-semibold mb-4 text-foreground">Event Portal Configuration</h2>
      <p className="text-sm text-text-muted mb-6">
        Manage the Know Before You Go information served to productionsite.guide for this specific project.
      </p>

      <Tabs tabs={PORTAL_TYPES} activeTab={activeTab} onTabChange={(key) => setActiveTab(key as PortalType)} />

      <div className="space-y-4 pt-4 mt-6">
        {isLoading ? (
          <div className="text-sm text-text-muted">Loading portal data...</div>
        ) : (
          <>
            {/* Published toggle */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_published"
                checked={data.is_published || false}
                onChange={(e) => {
                  if (e.target.checked) {
                    setShowPublishConfirm(true);
                    return;
                  }
                  updateField('is_published', e.target.checked);
                }}
              />
              <label htmlFor="is_published" className="text-sm font-medium">
                Publish this portal publicly
              </label>
            </div>

            {/* ── Core Info ──────────────────────────────────────────── */}
            <Section title="Core Info" defaultOpen>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Description</label>
                <FormTextarea
                  value={data.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder="Brief description of this portal audience..."
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Call Time / Doors Time</label>
                <FormInput
                  value={data.call_time}
                  onChange={(e) => updateField('call_time', e.target.value)}
                  placeholder={WAYFINDING_PLACEHOLDERS.call_time}
                />
              </div>
            </Section>

            {/* ── Wayfinding ─────────────────────────────────────────── */}
            <Section title="Wayfinding" defaultOpen>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Your Route In</label>
                <FormTextarea
                  value={data.route_in_instructions}
                  onChange={(e) => updateField('route_in_instructions', e.target.value)}
                  placeholder={WAYFINDING_PLACEHOLDERS.route_in}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Parking Instructions</label>
                  <FormTextarea value={data.parking_instructions} onChange={(e) => updateField('parking_instructions', e.target.value)} placeholder={WAYFINDING_PLACEHOLDERS.parking} rows={4} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Rideshare Instructions</label>
                  <FormTextarea value={data.rideshare_instructions} onChange={(e) => updateField('rideshare_instructions', e.target.value)} placeholder={WAYFINDING_PLACEHOLDERS.rideshare} rows={4} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Transit Instructions</label>
                  <FormTextarea value={data.transit_instructions} onChange={(e) => updateField('transit_instructions', e.target.value)} placeholder={WAYFINDING_PLACEHOLDERS.transit} rows={4} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Check-In Instructions</label>
                  <FormTextarea value={data.check_in_instructions} onChange={(e) => updateField('check_in_instructions', e.target.value)} placeholder={WAYFINDING_PLACEHOLDERS.check_in} rows={4} />
                </div>
              </div>
            </Section>

            {/* ── Pre-Arrival Checklist ──────────────────────────────── */}
            <Section title="Pre-Arrival Checklist">
              <ListEditor
                items={data.pre_arrival_checklist}
                onAdd={() => addToList('pre_arrival_checklist', { text: '', completed: false })}
                onRemove={(i) => removeFromList('pre_arrival_checklist', i)}
                renderItem={(item, i) => (
                  <FormInput
                    value={item.text}
                    onChange={(e) => updateInList('pre_arrival_checklist', i, { ...item, text: e.target.value })}
                    placeholder={WAYFINDING_PLACEHOLDERS.checklist}
                    className="flex-1"
                  />
                )}
                addLabel="Add Item"
                emptyLabel="No checklist items yet."
              />
            </Section>

            {/* ── Additional Notes ("A Few More Things") ────────────── */}
            <Section title="Additional Notes">
              <ListEditor
                items={data.additional_notes}
                onAdd={() => addToList('additional_notes', '')}
                onRemove={(i) => removeFromList('additional_notes', i)}
                renderItem={(item, i) => (
                  <FormInput
                    value={item}
                    onChange={(e) => updateInList('additional_notes', i, e.target.value)}
                    placeholder={WAYFINDING_PLACEHOLDERS.additional_note}
                    className="flex-1"
                  />
                )}
                addLabel="Add Note"
                emptyLabel="No additional notes yet."
              />
            </Section>

            {/* ── Radio Protocol (crew only) ─────────────────────────── */}
            {isCrew && (
              <Section title="Radio Protocol">
                <FormTextarea
                  value={data.radio_protocol}
                  onChange={(e) => updateField('radio_protocol', e.target.value)}
                  placeholder={WAYFINDING_PLACEHOLDERS.radio_protocol}
                  rows={4}
                />
              </Section>
            )}

            {/* ── Safety Rules (crew only) ───────────────────────────── */}
            {isCrew && (
              <Section title="Safety Rules">
                <ListEditor
                  items={data.safety_rules}
                  onAdd={() => addToList('safety_rules', '')}
                  onRemove={(i) => removeFromList('safety_rules', i)}
                  renderItem={(item, i) => (
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-xs text-text-muted font-mono w-6 shrink-0">{i + 1}.</span>
                      <FormInput
                        value={item}
                        onChange={(e) => updateInList('safety_rules', i, e.target.value)}
                        placeholder={WAYFINDING_PLACEHOLDERS.safety_rule}
                        className="flex-1"
                      />
                    </div>
                  )}
                  addLabel="Add Rule"
                  emptyLabel="No safety rules yet."
                />
              </Section>
            )}

            {/* ── Emergency Procedures (crew only) ───────────────────── */}
            {isCrew && (
              <Section title="Emergency Procedures">
                <div className="space-y-4">
                  {data.emergency_procedures.map((proc, i) => (
                    <div key={i} className="rounded-lg border border-border p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="grid grid-cols-3 gap-3 flex-1">
                          <FormInput value={proc.code} onChange={(e) => updateInList('emergency_procedures', i, { ...proc, code: e.target.value })} placeholder={WAYFINDING_PLACEHOLDERS.emergency_code} />
                          <FormInput value={proc.label} onChange={(e) => updateInList('emergency_procedures', i, { ...proc, label: e.target.value })} placeholder={WAYFINDING_PLACEHOLDERS.emergency_label} />
                          <FormInput value={proc.channel} onChange={(e) => updateInList('emergency_procedures', i, { ...proc, channel: e.target.value })} placeholder={WAYFINDING_PLACEHOLDERS.emergency_channel} />
                        </div>
                        <button onClick={() => removeFromList('emergency_procedures', i)} className="text-text-muted hover:text-red-500 p-1 ml-2"><Trash2 size={14} /></button>
                      </div>
                      <div>
                        <label className="block text-xs text-text-muted mb-1">Steps</label>
                        {proc.steps.map((step, si) => (
                          <div key={si} className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-text-muted font-mono w-5 shrink-0">{si + 1}.</span>
                            <FormInput
                              value={step}
                              onChange={(e) => {
                                const steps = [...proc.steps];
                                steps[si] = e.target.value;
                                updateInList('emergency_procedures', i, { ...proc, steps });
                              }}
                              placeholder={WAYFINDING_PLACEHOLDERS.emergency_step}
                              className="flex-1"
                            />
                            <button onClick={() => {
                              const steps = proc.steps.filter((_, idx) => idx !== si);
                              updateInList('emergency_procedures', i, { ...proc, steps });
                            }} className="text-text-muted hover:text-red-500 p-1"><Trash2 size={12} /></button>
                          </div>
                        ))}
                        <button
                          onClick={() => updateInList('emergency_procedures', i, { ...proc, steps: [...proc.steps, ''] })}
                          className="text-xs font-medium text-text-muted hover:text-foreground flex items-center gap-1 mt-1"
                        ><Plus size={10} /> Add Step</button>
                      </div>
                      <div>
                        <label className="block text-xs text-text-muted mb-1">Good to Know</label>
                        <FormTextarea value={proc.good_to_know} onChange={(e) => updateInList('emergency_procedures', i, { ...proc, good_to_know: e.target.value })} placeholder={WAYFINDING_PLACEHOLDERS.emergency_good_to_know} rows={2} />
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => addToList('emergency_procedures', { code: '', label: '', channel: '', steps: [''], good_to_know: '' })}
                    className="text-xs font-medium text-text-muted hover:text-foreground flex items-center gap-1"
                  ><Plus size={12} /> Add Emergency Code</button>
                </div>
              </Section>
            )}

            {/* ── Evacuation Info ────────────────────────────────────── */}
            <Section title="Evacuation Routes">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Assembly Point</label>
                  <FormInput value={data.evacuation_info.assembly_point} onChange={(e) => updateField('evacuation_info', { ...data.evacuation_info, assembly_point: e.target.value })} placeholder={WAYFINDING_PLACEHOLDERS.evacuation_assembly} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">EMS Staging</label>
                  <FormInput value={data.evacuation_info.ems_staging} onChange={(e) => updateField('evacuation_info', { ...data.evacuation_info, ems_staging: e.target.value })} placeholder={WAYFINDING_PLACEHOLDERS.evacuation_ems} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Instructions</label>
                  <FormInput value={data.evacuation_info.instructions} onChange={(e) => updateField('evacuation_info', { ...data.evacuation_info, instructions: e.target.value })} placeholder={WAYFINDING_PLACEHOLDERS.evacuation_instructions} />
                </div>
              </div>
            </Section>

            {/* ── Accessibility ──────────────────────────────────────── */}
            <Section title="Accessibility (ADA)">
              <ListEditor
                items={data.accessibility}
                onAdd={() => addToList('accessibility', { type: '', description: '' })}
                onRemove={(i) => removeFromList('accessibility', i)}
                renderItem={(item, i) => (
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                    <FormInput value={item.type} onChange={(e) => updateInList('accessibility', i, { ...item, type: e.target.value })} placeholder={WAYFINDING_PLACEHOLDERS.accessibility_type} />
                    <FormInput value={item.description} onChange={(e) => updateInList('accessibility', i, { ...item, description: e.target.value })} placeholder={WAYFINDING_PLACEHOLDERS.accessibility_description} />
                  </div>
                )}
                addLabel="Add Item"
                emptyLabel="No accessibility items yet."
              />
            </Section>

            {/* ── Amenities ──────────────────────────────────────────── */}
            <Section title="Amenities">
              <ListEditor
                items={data.amenities}
                onAdd={() => addToList('amenities', { key: '', label: '', description: '', available: true })}
                onRemove={(i) => removeFromList('amenities', i)}
                renderItem={(item, i) => (
                  <div className="flex-1 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <FormInput value={item.label} onChange={(e) => updateInList('amenities', i, { ...item, label: e.target.value, key: e.target.value.toLowerCase().replace(/\s+/g, '_') })} placeholder="e.g. Crew Break Area" />
                      <div className="flex items-center gap-2">
                        <input type="checkbox" checked={item.available} onChange={(e) => updateInList('amenities', i, { ...item, available: e.target.checked })} />
                        <span className="text-xs text-text-muted">Available</span>
                      </div>
                    </div>
                    <FormInput value={item.description} onChange={(e) => updateInList('amenities', i, { ...item, description: e.target.value })} placeholder="e.g. Clubhouse second-floor lounge. Climate-controlled with seating." />
                  </div>
                )}
                addLabel="Add Amenity"
                emptyLabel="No amenities configured yet."
              />
            </Section>

            {/* ── Schedule / Lineup ──────────────────────────────────── */}
            <Section title="Schedule / Lineup">
              <ListEditor
                items={data.schedule}
                onAdd={() => addToList('schedule', { artist: '', start_time: '', end_time: '' })}
                onRemove={(i) => removeFromList('schedule', i)}
                renderItem={(item, i) => (
                  <div className="flex-1 grid grid-cols-3 gap-2">
                    <FormInput value={item.artist} onChange={(e) => updateInList('schedule', i, { ...item, artist: e.target.value })} placeholder="Artist name" />
                    <FormInput value={item.start_time} onChange={(e) => updateInList('schedule', i, { ...item, start_time: e.target.value })} placeholder="e.g. 6:00 PM" />
                    <FormInput value={item.end_time} onChange={(e) => updateInList('schedule', i, { ...item, end_time: e.target.value })} placeholder="e.g. 7:30 PM" />
                  </div>
                )}
                addLabel="Add Artist"
                emptyLabel="No schedule entries yet."
              />
            </Section>

            {/* ── FAQs ───────────────────────────────────────────────── */}
            <Section title="Guest FAQs">
              <QAEditor
                items={data.faqs}
                onAdd={() => addToList('faqs', { q: '', a: '' })}
                onUpdate={(i, field, val) => updateInList('faqs', i, { ...data.faqs[i], [field]: val })}
                onRemove={(i) => removeFromList('faqs', i)}
                qPlaceholder={WAYFINDING_PLACEHOLDERS.faq_q}
                aPlaceholder={WAYFINDING_PLACEHOLDERS.faq_a}
                emptyLabel="No FAQs yet."
              />
            </Section>

            {/* ── Crew Intel (crew only) ─────────────────────────────── */}
            {isCrew && (
              <Section title="Crew Intel">
                <QAEditor
                  items={data.crew_intel}
                  onAdd={() => addToList('crew_intel', { q: '', a: '' })}
                  onUpdate={(i, field, val) => updateInList('crew_intel', i, { ...data.crew_intel[i], [field]: val })}
                  onRemove={(i) => removeFromList('crew_intel', i)}
                  qPlaceholder={WAYFINDING_PLACEHOLDERS.crew_intel_q}
                  aPlaceholder={WAYFINDING_PLACEHOLDERS.crew_intel_a}
                  emptyLabel="No crew intel items yet."
                />
              </Section>
            )}

            {/* ── Guest Policies (guest only) ────────────────────────── */}
            {isGuest && (
              <Section title="Guest Policies">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Bag Policy</label>
                    <FormTextarea value={data.guest_policies.bag_policy} onChange={(e) => updateField('guest_policies', { ...data.guest_policies, bag_policy: e.target.value })} placeholder={WAYFINDING_PLACEHOLDERS.guest_bag_policy} rows={2} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Re-Entry Policy</label>
                    <FormTextarea value={data.guest_policies.re_entry_policy} onChange={(e) => updateField('guest_policies', { ...data.guest_policies, re_entry_policy: e.target.value })} placeholder={WAYFINDING_PLACEHOLDERS.guest_re_entry} rows={2} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Age Requirements</label>
                    <FormInput value={data.guest_policies.age_requirements} onChange={(e) => updateField('guest_policies', { ...data.guest_policies, age_requirements: e.target.value })} placeholder={WAYFINDING_PLACEHOLDERS.guest_age_requirements} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Dress Code</label>
                    <FormInput value={data.guest_policies.dress_code} onChange={(e) => updateField('guest_policies', { ...data.guest_policies, dress_code: e.target.value })} placeholder={WAYFINDING_PLACEHOLDERS.guest_dress_code} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Smoking Policy</label>
                    <FormInput value={data.guest_policies.smoking_policy} onChange={(e) => updateField('guest_policies', { ...data.guest_policies, smoking_policy: e.target.value })} placeholder={WAYFINDING_PLACEHOLDERS.guest_smoking_policy} />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-text-secondary">Prohibited Items</label>
                      <button
                        onClick={() => updateField('guest_policies', { ...data.guest_policies, prohibited_items: [...data.guest_policies.prohibited_items, ''] })}
                        className="text-xs font-medium text-text-muted hover:text-foreground flex items-center gap-1"
                      ><Plus size={12} /> Add Item</button>
                    </div>
                    {data.guest_policies.prohibited_items.length === 0 ? (
                      <p className="text-xs text-text-muted italic">No prohibited items listed.</p>
                    ) : (
                      <div className="space-y-2">
                        {data.guest_policies.prohibited_items.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <FormInput
                              value={item}
                              onChange={(e) => {
                                const items = [...data.guest_policies.prohibited_items];
                                items[idx] = e.target.value;
                                updateField('guest_policies', { ...data.guest_policies, prohibited_items: items });
                              }}
                              placeholder={WAYFINDING_PLACEHOLDERS.guest_prohibited_item}
                              className="flex-1"
                            />
                            <button onClick={() => {
                              const items = data.guest_policies.prohibited_items.filter((_, i) => i !== idx);
                              updateField('guest_policies', { ...data.guest_policies, prohibited_items: items });
                            }} className="text-text-muted hover:text-red-500 p-1"><Trash2 size={14} /></button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Section>
            )}

            {/* ── Sustainability (guest only) ────────────────────────── */}
            {isGuest && (
              <Section title="Sustainability">
                <ListEditor
                  items={data.sustainability}
                  onAdd={() => addToList('sustainability', { type: '', description: '' })}
                  onRemove={(i) => removeFromList('sustainability', i)}
                  renderItem={(item, i) => (
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                      <FormInput value={item.type} onChange={(e) => updateInList('sustainability', i, { ...item, type: e.target.value })} placeholder={WAYFINDING_PLACEHOLDERS.sustainability_type} />
                      <FormInput value={item.description} onChange={(e) => updateInList('sustainability', i, { ...item, description: e.target.value })} placeholder={WAYFINDING_PLACEHOLDERS.sustainability_description} />
                    </div>
                  )}
                  addLabel="Add Item"
                  emptyLabel="No sustainability items yet."
                />
              </Section>
            )}

            {/* ── External Links ──────────────────────────────────────── */}
            <Section title="External Links">
              <ListEditor
                items={data.external_links}
                onAdd={() => addToList('external_links', { label: '', url: '' })}
                onRemove={(i) => removeFromList('external_links', i)}
                renderItem={(item, i) => (
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <FormInput value={item.label} onChange={(e) => updateInList('external_links', i, { ...item, label: e.target.value })} placeholder={WAYFINDING_PLACEHOLDERS.external_link_label} />
                    <FormInput value={item.url} onChange={(e) => updateInList('external_links', i, { ...item, url: e.target.value })} placeholder={WAYFINDING_PLACEHOLDERS.external_link_url} />
                  </div>
                )}
                addLabel="Add Link"
                emptyLabel="No external links yet."
              />
            </Section>

            {/* ── Artist Social Links ─────────────────────────────────── */}
            <Section title="Artist Social Links">
              <ListEditor
                items={data.artist_social_links}
                onAdd={() => addToList('artist_social_links', { name: '', handle: '', url: '' })}
                onRemove={(i) => removeFromList('artist_social_links', i)}
                renderItem={(item, i) => (
                  <div className="flex-1 grid grid-cols-3 gap-2">
                    <FormInput value={item.name} onChange={(e) => updateInList('artist_social_links', i, { ...item, name: e.target.value })} placeholder={WAYFINDING_PLACEHOLDERS.social_artist_name} />
                    <FormInput value={item.handle} onChange={(e) => updateInList('artist_social_links', i, { ...item, handle: e.target.value })} placeholder={WAYFINDING_PLACEHOLDERS.social_handle} />
                    <FormInput value={item.url} onChange={(e) => updateInList('artist_social_links', i, { ...item, url: e.target.value })} placeholder={WAYFINDING_PLACEHOLDERS.social_url} />
                  </div>
                )}
                addLabel="Add Artist"
                emptyLabel="No artist social links yet."
              />
            </Section>

            {/* ── Save ───────────────────────────────────────────────── */}
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
                updateField('is_published', true);
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

// ─── Reusable sub-components ──────────────────────────────────────────────────

function ListEditor<T>({
  items,
  onAdd,
  onRemove,
  renderItem,
  addLabel,
  emptyLabel,
}: {
  items: T[];
  onAdd: () => void;
  onRemove: (i: number) => void;
  renderItem: (item: T, index: number) => React.ReactNode;
  addLabel: string;
  emptyLabel: string;
}) {
  return (
    <div>
      {items.length === 0 ? (
        <p className="text-xs text-text-muted italic mb-2">{emptyLabel}</p>
      ) : (
        <div className="space-y-2 mb-2">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-start gap-2">
              {renderItem(item, idx)}
              <button onClick={() => onRemove(idx)} className="text-text-muted hover:text-red-500 p-1 mt-1 shrink-0">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
      <button onClick={onAdd} className="text-xs font-medium text-text-muted hover:text-foreground flex items-center gap-1">
        <Plus size={12} /> {addLabel}
      </button>
    </div>
  );
}

function QAEditor({
  items,
  onAdd,
  onUpdate,
  onRemove,
  qPlaceholder,
  aPlaceholder,
  emptyLabel,
}: {
  items: FaqEntry[];
  onAdd: () => void;
  onUpdate: (i: number, field: 'q' | 'a', value: string) => void;
  onRemove: (i: number) => void;
  qPlaceholder: string;
  aPlaceholder: string;
  emptyLabel: string;
}) {
  return (
    <div>
      {items.length === 0 ? (
        <p className="text-xs text-text-muted italic mb-2">{emptyLabel}</p>
      ) : (
        <div className="space-y-4 mb-2">
          {items.map((faq, idx) => (
            <div key={idx} className="rounded-lg border border-border p-3 space-y-2">
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <FormInput value={faq.q} onChange={(e) => onUpdate(idx, 'q', e.target.value)} placeholder={qPlaceholder} />
                </div>
                <button onClick={() => onRemove(idx)} className="text-text-muted hover:text-red-500 p-1 mt-1">
                  <Trash2 size={14} />
                </button>
              </div>
              <FormTextarea value={faq.a} onChange={(e) => onUpdate(idx, 'a', e.target.value)} placeholder={aPlaceholder} rows={2} />
            </div>
          ))}
        </div>
      )}
      <button onClick={onAdd} className="text-xs font-medium text-text-muted hover:text-foreground flex items-center gap-1">
        <Plus size={12} /> Add FAQ
      </button>
    </div>
  );
}
