'use client';

import type { RequirementAssignee } from '@/types/database';

export interface DeliverableData {
  id: string;
  name: string;
  description: string;
  category: string;
  unit: string;
  qty: number;
  unitCost: number;
  totalCost: number;
}

export interface AddonData extends DeliverableData {
  selected: boolean;
  mutuallyExclusiveGroup: string;
}

export interface MilestoneRequirementData {
  id: string;
  text: string;
  assignee: RequirementAssignee;
}

export interface MilestoneData {
  name: string;
  requirements: MilestoneRequirementData[];
}

export interface PhaseData {
  id: string;
  number: string;
  name: string;
  subtitle: string;
  narrative: string;
  deliverables: DeliverableData[];
  addons: AddonData[];
  milestone: MilestoneData;
}

interface PhaseEditorStepProps {
  phase: PhaseData;
  onChange: (phase: PhaseData) => void;
}

const CATEGORY_SUGGESTIONS = [
  'Design',
  'Fabrication',
  'Technology',
  'Logistics',
  'Staffing',
  'AV/Production',
  'Content',
  'Installation',
  'Management',
];

const UNIT_OPTIONS = ['unit', 'hour', 'day', 'sq ft', 'linear ft', 'lot', 'each', 'set', 'person'];

const ASSIGNEE_OPTIONS: { value: RequirementAssignee; label: string }[] = [
  { value: 'client', label: 'Client' },
  { value: 'producer', label: 'Producer' },
  { value: 'both', label: 'Both' },
  { value: 'external_vendor', label: 'External Vendor' },
];

function createEmptyDeliverable(): DeliverableData {
  return {
    id: crypto.randomUUID(),
    name: '',
    description: '',
    category: '',
    unit: 'unit',
    qty: 1,
    unitCost: 0,
    totalCost: 0,
  };
}

function createEmptyAddon(): AddonData {
  return {
    id: crypto.randomUUID(),
    name: '',
    description: '',
    category: '',
    unit: 'unit',
    qty: 1,
    unitCost: 0,
    totalCost: 0,
    selected: false,
    mutuallyExclusiveGroup: '',
  };
}

function createEmptyRequirement(): MilestoneRequirementData {
  return {
    id: crypto.randomUUID(),
    text: '',
    assignee: 'producer',
  };
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export default function PhaseEditorStep({ phase, onChange }: PhaseEditorStepProps) {
  const update = (partial: Partial<PhaseData>) => {
    onChange({ ...phase, ...partial });
  };

  // Deliverables
  const addDeliverable = () => {
    update({ deliverables: [...phase.deliverables, createEmptyDeliverable()] });
  };

  const updateDeliverable = (index: number, partial: Partial<DeliverableData>) => {
    const updated = [...phase.deliverables];
    const item = { ...updated[index], ...partial };
    // Auto-calculate total
    if ('qty' in partial || 'unitCost' in partial) {
      item.totalCost = item.qty * item.unitCost;
    }
    updated[index] = item;
    update({ deliverables: updated });
  };

  const removeDeliverable = (index: number) => {
    update({ deliverables: phase.deliverables.filter((_, i) => i !== index) });
  };

  // Add-ons
  const addAddon = () => {
    update({ addons: [...phase.addons, createEmptyAddon()] });
  };

  const updateAddon = (index: number, partial: Partial<AddonData>) => {
    const updated = [...phase.addons];
    const item = { ...updated[index], ...partial };
    if ('qty' in partial || 'unitCost' in partial) {
      item.totalCost = item.qty * item.unitCost;
    }
    updated[index] = item;
    update({ addons: updated });
  };

  const removeAddon = (index: number) => {
    update({ addons: phase.addons.filter((_, i) => i !== index) });
  };

  // Milestone
  const addRequirement = () => {
    update({
      milestone: {
        ...phase.milestone,
        requirements: [...phase.milestone.requirements, createEmptyRequirement()],
      },
    });
  };

  const updateRequirement = (index: number, partial: Partial<MilestoneRequirementData>) => {
    const updated = [...phase.milestone.requirements];
    updated[index] = { ...updated[index], ...partial };
    update({ milestone: { ...phase.milestone, requirements: updated } });
  };

  const removeRequirement = (index: number) => {
    update({
      milestone: {
        ...phase.milestone,
        requirements: phase.milestone.requirements.filter((_, i) => i !== index),
      },
    });
  };

  // Totals
  const deliverablesTotal = phase.deliverables.reduce((sum, d) => sum + d.totalCost, 0);
  const selectedAddonsTotal = phase.addons
    .filter((a) => a.selected)
    .reduce((sum, a) => sum + a.totalCost, 0);
  const phaseSubtotal = deliverablesTotal + selectedAddonsTotal;

  return (
    <div className="space-y-8">
      {/* Phase Header */}
      <div className="space-y-4">
        <div className="flex items-baseline gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-org-primary text-xs font-bold text-white">
            {phase.number}
          </span>
          <div className="flex-1 space-y-3">
            <input
              type="text"
              value={phase.name}
              onChange={(e) => update({ name: e.target.value })}
              placeholder="Phase Name"
              className="w-full text-lg font-semibold text-foreground border-0 border-b border-transparent bg-transparent px-0 py-1 focus:border-b-org-primary focus:outline-none"
            />
            <input
              type="text"
              value={phase.subtitle}
              onChange={(e) => update({ subtitle: e.target.value })}
              placeholder="Phase Subtitle"
              className="w-full text-sm text-text-secondary border-0 border-b border-transparent bg-transparent px-0 py-1 focus:border-b-org-primary focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Narrative */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Narrative</label>
        <textarea
          rows={5}
          value={phase.narrative}
          onChange={(e) => update({ narrative: e.target.value })}
          placeholder="Describe this phase of the project. This text will appear in the client proposal..."
          className="w-full rounded-lg border border-border bg-white px-4 py-3 text-sm text-foreground placeholder:text-text-muted focus:border-org-primary focus:outline-none focus:ring-1 focus:ring-org-primary resize-y leading-relaxed"
        />
        <p className="mt-1 text-xs text-text-muted">Rich text editor coming soon. Plain text for now.</p>
      </div>

      {/* Deliverables Table */}
      <div>
        <h3 className="text-sm font-medium text-foreground mb-3">Deliverables</h3>

        {phase.deliverables.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-bg-secondary border-b border-border">
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Name</th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Description</th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-text-muted w-28">Category</th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-text-muted w-24">Unit</th>
                  <th className="px-3 py-2 text-right text-xs font-medium uppercase tracking-wider text-text-muted w-16">Qty</th>
                  <th className="px-3 py-2 text-right text-xs font-medium uppercase tracking-wider text-text-muted w-24">Unit Cost</th>
                  <th className="px-3 py-2 text-right text-xs font-medium uppercase tracking-wider text-text-muted w-24">Total</th>
                  <th className="px-3 py-2 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {phase.deliverables.map((d, index) => (
                  <tr key={d.id} className="hover:bg-bg-secondary/50">
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={d.name}
                        onChange={(e) => updateDeliverable(index, { name: e.target.value })}
                        placeholder="Item name"
                        className="w-full bg-transparent text-sm text-foreground border-0 px-0 py-0.5 focus:outline-none focus:ring-0"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={d.description}
                        onChange={(e) => updateDeliverable(index, { description: e.target.value })}
                        placeholder="Description"
                        className="w-full bg-transparent text-sm text-foreground border-0 px-0 py-0.5 focus:outline-none focus:ring-0"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={d.category}
                        onChange={(e) => updateDeliverable(index, { category: e.target.value })}
                        className="w-full bg-transparent text-sm text-foreground border-0 px-0 py-0.5 focus:outline-none focus:ring-0"
                      >
                        <option value="">--</option>
                        {CATEGORY_SUGGESTIONS.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={d.unit}
                        onChange={(e) => updateDeliverable(index, { unit: e.target.value })}
                        className="w-full bg-transparent text-sm text-foreground border-0 px-0 py-0.5 focus:outline-none focus:ring-0"
                      >
                        {UNIT_OPTIONS.map((u) => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={0}
                        value={d.qty}
                        onChange={(e) => updateDeliverable(index, { qty: Number(e.target.value) })}
                        className="w-full bg-transparent text-sm text-foreground text-right border-0 px-0 py-0.5 focus:outline-none focus:ring-0"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={d.unitCost}
                        onChange={(e) => updateDeliverable(index, { unitCost: Number(e.target.value) })}
                        className="w-full bg-transparent text-sm text-foreground text-right border-0 px-0 py-0.5 focus:outline-none focus:ring-0"
                      />
                    </td>
                    <td className="px-3 py-2 text-right text-sm font-medium text-foreground">
                      {formatCurrency(d.totalCost)}
                    </td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => removeDeliverable(index)}
                        className="p-0.5 text-text-muted hover:text-error"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-border bg-bg-secondary">
                  <td colSpan={6} className="px-3 py-2 text-right text-xs font-medium uppercase tracking-wider text-text-muted">
                    Deliverables Subtotal
                  </td>
                  <td className="px-3 py-2 text-right text-sm font-semibold text-foreground">
                    {formatCurrency(deliverablesTotal)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        <button
          type="button"
          onClick={addDeliverable}
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-text-secondary hover:text-org-primary transition-colors"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Deliverable
        </button>
      </div>

      {/* Add-ons Table */}
      <div>
        <h3 className="text-sm font-medium text-foreground mb-1">Add-ons</h3>
        <p className="text-xs text-text-muted mb-3">Optional items the client can select.</p>

        {phase.addons.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-addon/30">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-addon-bg border-b border-addon/20">
                  <th className="px-3 py-2 text-center text-xs font-medium uppercase tracking-wider text-addon w-10">On</th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-addon">Name</th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-addon">Description</th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-addon w-28">Category</th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-addon w-24">Unit</th>
                  <th className="px-3 py-2 text-right text-xs font-medium uppercase tracking-wider text-addon w-16">Qty</th>
                  <th className="px-3 py-2 text-right text-xs font-medium uppercase tracking-wider text-addon w-24">Unit Cost</th>
                  <th className="px-3 py-2 text-right text-xs font-medium uppercase tracking-wider text-addon w-24">Total</th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-addon w-28">Excl. Group</th>
                  <th className="px-3 py-2 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-addon/10">
                {phase.addons.map((a, index) => (
                  <tr key={a.id} className={a.selected ? 'bg-addon-bg/50' : 'hover:bg-bg-secondary/50'}>
                    <td className="px-3 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={a.selected}
                        onChange={(e) => updateAddon(index, { selected: e.target.checked })}
                        className="rounded border-border text-addon focus:ring-addon"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={a.name}
                        onChange={(e) => updateAddon(index, { name: e.target.value })}
                        placeholder="Add-on name"
                        className="w-full bg-transparent text-sm text-foreground border-0 px-0 py-0.5 focus:outline-none focus:ring-0"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={a.description}
                        onChange={(e) => updateAddon(index, { description: e.target.value })}
                        placeholder="Description"
                        className="w-full bg-transparent text-sm text-foreground border-0 px-0 py-0.5 focus:outline-none focus:ring-0"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={a.category}
                        onChange={(e) => updateAddon(index, { category: e.target.value })}
                        className="w-full bg-transparent text-sm text-foreground border-0 px-0 py-0.5 focus:outline-none focus:ring-0"
                      >
                        <option value="">--</option>
                        {CATEGORY_SUGGESTIONS.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={a.unit}
                        onChange={(e) => updateAddon(index, { unit: e.target.value })}
                        className="w-full bg-transparent text-sm text-foreground border-0 px-0 py-0.5 focus:outline-none focus:ring-0"
                      >
                        {UNIT_OPTIONS.map((u) => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={0}
                        value={a.qty}
                        onChange={(e) => updateAddon(index, { qty: Number(e.target.value) })}
                        className="w-full bg-transparent text-sm text-foreground text-right border-0 px-0 py-0.5 focus:outline-none focus:ring-0"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={a.unitCost}
                        onChange={(e) => updateAddon(index, { unitCost: Number(e.target.value) })}
                        className="w-full bg-transparent text-sm text-foreground text-right border-0 px-0 py-0.5 focus:outline-none focus:ring-0"
                      />
                    </td>
                    <td className="px-3 py-2 text-right text-sm font-medium text-foreground">
                      {formatCurrency(a.totalCost)}
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={a.mutuallyExclusiveGroup}
                        onChange={(e) => updateAddon(index, { mutuallyExclusiveGroup: e.target.value })}
                        placeholder="Group"
                        className="w-full bg-transparent text-sm text-foreground border-0 px-0 py-0.5 focus:outline-none focus:ring-0"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => removeAddon(index)}
                        className="p-0.5 text-text-muted hover:text-error"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <button
          type="button"
          onClick={addAddon}
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-text-secondary hover:text-addon transition-colors"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Add-on
        </button>
      </div>

      {/* Milestone Gate */}
      <div>
        <h3 className="text-sm font-medium text-foreground mb-1">Milestone Gate</h3>
        <p className="text-xs text-text-muted mb-3">Requirements that must be met before proceeding to the next phase.</p>

        <div className="rounded-lg border border-milestone/30 bg-milestone-bg/30 px-5 py-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Milestone Name</label>
            <input
              type="text"
              value={phase.milestone.name}
              onChange={(e) =>
                update({ milestone: { ...phase.milestone, name: e.target.value } })
              }
              placeholder="e.g., Phase 1 Approval Gate"
              className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground placeholder:text-text-muted focus:border-milestone focus:outline-none focus:ring-1 focus:ring-milestone"
            />
          </div>

          {phase.milestone.requirements.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-text-secondary">Requirements</p>
              {phase.milestone.requirements.map((req, index) => (
                <div key={req.id} className="flex items-center gap-3">
                  <input
                    type="text"
                    value={req.text}
                    onChange={(e) => updateRequirement(index, { text: e.target.value })}
                    placeholder="Requirement description"
                    className="flex-1 rounded-lg border border-border bg-white px-3 py-1.5 text-sm text-foreground placeholder:text-text-muted focus:border-milestone focus:outline-none focus:ring-1 focus:ring-milestone"
                  />
                  <select
                    value={req.assignee}
                    onChange={(e) =>
                      updateRequirement(index, {
                        assignee: e.target.value as RequirementAssignee,
                      })
                    }
                    className="w-36 rounded-lg border border-border bg-white px-3 py-1.5 text-sm text-foreground focus:border-milestone focus:outline-none focus:ring-1 focus:ring-milestone"
                  >
                    {ASSIGNEE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => removeRequirement(index)}
                    className="p-0.5 text-text-muted hover:text-error"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={addRequirement}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-milestone hover:text-milestone/80 transition-colors"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Requirement
          </button>
        </div>
      </div>

      {/* Phase Subtotal */}
      <div className="rounded-lg bg-bg-secondary px-5 py-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">Phase {phase.number} Subtotal</p>
          <p className="text-xs text-text-muted">
            Deliverables: {formatCurrency(deliverablesTotal)}
            {selectedAddonsTotal > 0 && ` + Add-ons: ${formatCurrency(selectedAddonsTotal)}`}
          </p>
        </div>
        <p className="text-xl font-semibold text-foreground">{formatCurrency(phaseSubtotal)}</p>
      </div>
    </div>
  );
}
