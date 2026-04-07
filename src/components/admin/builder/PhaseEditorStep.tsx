'use client';

import {
  type PhaseData,
  type DeliverableData,
  type AddonData,
  type MilestoneRequirementData,
  CATEGORY_SUGGESTIONS,
  UNIT_OPTIONS,
  ASSIGNEE_OPTIONS,
  createEmptyDeliverable,
  createEmptyAddon,
  createEmptyRequirement,
  formatCurrency,
} from './types';
import type { RequirementAssignee } from '@/types/database';
import FormSelect from '@/components/ui/FormSelect';
import FormTextarea from '@/components/ui/FormTextarea';
import FormInput from '@/components/ui/FormInput';
import FormLabel from '@/components/ui/FormLabel';
import { IconPlus } from '@/components/ui/Icons';

export type { DeliverableData, AddonData, MilestoneRequirementData, PhaseData } from './types';

interface PhaseEditorStepProps {
  phase: PhaseData;
  onChange: (phase: PhaseData) => void;
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
            <FormInput
              type="text"
              value={phase.name}
              onChange={(e) => update({ name: e.target.value })}
              placeholder="Phase Name" />
            <FormInput
              type="text"
              value={phase.subtitle}
              onChange={(e) => update({ subtitle: e.target.value })}
              placeholder="Phase Subtitle" />
          </div>
        </div>
      </div>

      {/* Narrative */}
      <div>
        <FormLabel>Narrative</FormLabel>
        <FormTextarea
          rows={5}
          value={phase.narrative}
          onChange={(e) => update({ narrative: e.target.value })}
          placeholder="Describe this phase of the project. This text will appear in the client proposal..." />
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
                      <FormInput
                        type="text"
                        value={d.name}
                        onChange={(e) => updateDeliverable(index, { name: e.target.value })}
                        placeholder="Item name" />
                    </td>
                    <td className="px-3 py-2">
                      <FormInput
                        type="text"
                        value={d.description}
                        onChange={(e) => updateDeliverable(index, { description: e.target.value })}
                        placeholder="Description" />
                    </td>
                    <td className="px-3 py-2">
                      <FormSelect
                        value={d.category}
                        onChange={(e) => updateDeliverable(index, { category: e.target.value })}
                      >
                        <option value="">--</option>
                        {CATEGORY_SUGGESTIONS.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </FormSelect>
                    </td>
                    <td className="px-3 py-2">
                      <FormSelect
                        value={d.unit}
                        onChange={(e) => updateDeliverable(index, { unit: e.target.value })}
                      >
                        {UNIT_OPTIONS.map((u) => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </FormSelect>
                    </td>
                    <td className="px-3 py-2">
                      <FormInput
                        type="number"
                        min={0}
                        value={d.qty}
                        onChange={(e) => updateDeliverable(index, { qty: Number(e.target.value) })} />
                    </td>
                    <td className="px-3 py-2">
                      <FormInput
                        type="number"
                        min={0}
                        step={0.01}
                        value={d.unitCost}
                        onChange={(e) => updateDeliverable(index, { unitCost: Number(e.target.value) })} />
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
          <IconPlus size={14} />
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
                      <FormInput
                        type="text"
                        value={a.name}
                        onChange={(e) => updateAddon(index, { name: e.target.value })}
                        placeholder="Add-on name" />
                    </td>
                    <td className="px-3 py-2">
                      <FormInput
                        type="text"
                        value={a.description}
                        onChange={(e) => updateAddon(index, { description: e.target.value })}
                        placeholder="Description" />
                    </td>
                    <td className="px-3 py-2">
                      <FormSelect
                        value={a.category}
                        onChange={(e) => updateAddon(index, { category: e.target.value })}
                      >
                        <option value="">--</option>
                        {CATEGORY_SUGGESTIONS.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </FormSelect>
                    </td>
                    <td className="px-3 py-2">
                      <FormSelect
                        value={a.unit}
                        onChange={(e) => updateAddon(index, { unit: e.target.value })}
                      >
                        {UNIT_OPTIONS.map((u) => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </FormSelect>
                    </td>
                    <td className="px-3 py-2">
                      <FormInput
                        type="number"
                        min={0}
                        value={a.qty}
                        onChange={(e) => updateAddon(index, { qty: Number(e.target.value) })} />
                    </td>
                    <td className="px-3 py-2">
                      <FormInput
                        type="number"
                        min={0}
                        step={0.01}
                        value={a.unitCost}
                        onChange={(e) => updateAddon(index, { unitCost: Number(e.target.value) })} />
                    </td>
                    <td className="px-3 py-2 text-right text-sm font-medium text-foreground">
                      {formatCurrency(a.totalCost)}
                    </td>
                    <td className="px-3 py-2">
                      <FormInput
                        type="text"
                        value={a.mutuallyExclusiveGroup}
                        onChange={(e) => updateAddon(index, { mutuallyExclusiveGroup: e.target.value })}
                        placeholder="Group" />
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
          <IconPlus size={14} />
          Add Add-on
        </button>
      </div>

      {/* Milestone Gate */}
      <div>
        <h3 className="text-sm font-medium text-foreground mb-1">Milestone Gate</h3>
        <p className="text-xs text-text-muted mb-3">Requirements that must be met before proceeding to the next phase.</p>

        <div className="rounded-lg border border-milestone/30 bg-milestone-bg/30 px-5 py-4 space-y-4">
          <div>
            <FormLabel>Milestone Name</FormLabel>
            <FormInput
              type="text"
              value={phase.milestone.name}
              onChange={(e) =>
                update({ milestone: { ...phase.milestone, name: e.target.value } })
              }
              placeholder="e.g., Phase 1 Approval Gate" />
          </div>

          {phase.milestone.requirements.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-text-secondary">Requirements</p>
              {phase.milestone.requirements.map((req, index) => (
                <div key={req.id} className="flex items-center gap-3">
                  <FormInput
                    type="text"
                    value={req.text}
                    onChange={(e) => updateRequirement(index, { text: e.target.value })}
                    placeholder="Requirement description" />
                  <FormSelect
                    value={req.assignee}
                    onChange={(e) =>
                      updateRequirement(index, {
                        assignee: e.target.value as RequirementAssignee,
                      })
                    }
                  >
                    {ASSIGNEE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </FormSelect>
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
            <IconPlus size={14} />
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
