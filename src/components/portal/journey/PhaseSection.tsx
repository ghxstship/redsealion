'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { fmTransition } from '@/lib/motion';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { formatCurrency } from '@/lib/utils';
import type {
  Phase,
  PhaseDeliverable,
  PhaseAddon,
  MilestoneGate as MilestoneGateType,
  MilestoneRequirement,
  CreativeReference,
} from '@/types/database';
import AddOnSelector from './AddOnSelector';
import MilestoneGateComponent from './MilestoneGate';

interface PhaseSectionProps {
  phase: Phase;
  deliverables: PhaseDeliverable[];
  addons: PhaseAddon[];
  milestone: (MilestoneGateType & { requirements?: MilestoneRequirement[] }) | null;
  creativeReferences: CreativeReference[];
  selectedAddonIds: Set<string>;
  onAddonToggle: (addon: PhaseAddon) => void;
  onMilestoneApprove?: (milestoneId: string, requirementId: string) => void;
  currency?: string;
}

export default function PhaseSection({
  phase,
  deliverables,
  addons,
  milestone,
  creativeReferences,
  selectedAddonIds,
  onAddonToggle,
  onMilestoneApprove,
  currency = 'USD',
}: PhaseSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  const prefersReduced = useReducedMotion();

  const phaseSubtotal = deliverables.reduce((sum, d) => sum + d.total_cost, 0);

  return (
    <motion.section
      ref={ref}
      id={`phase-${phase.id}`}
      initial={prefersReduced ? false : { opacity: 0, y: 48 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 48 }}
      transition={prefersReduced ? { duration: 0 } : fmTransition.decorative}
      className="scroll-mt-28"
    >
      <div className="py-20 lg:py-28">
        {/* Phase header */}
        <div className="mb-12 lg:mb-16">
          <p
            className="text-sm font-medium tracking-[0.2em] uppercase mb-3"
            style={{ color: 'var(--org-primary)' }}
          >
            Phase {phase.phase_number}
          </p>
          <h2 className="text-4xl lg:text-5xl font-light tracking-tight text-foreground mb-3">
            {phase.name}
          </h2>
          {phase.subtitle && (
            <p className="text-lg lg:text-xl text-text-secondary font-light">
              {phase.subtitle}
            </p>
          )}
        </div>

        {/* Narrative */}
        {phase.narrative && (
          <div
            className="mb-16 lg:mb-20 pl-6 lg:pl-8 border-l-2 max-w-3xl"
            style={{ borderColor: 'var(--org-primary)' }}
          >
            <p className="text-base lg:text-lg leading-relaxed text-text-secondary font-light">
              {phase.narrative}
            </p>
          </div>
        )}

        {/* Creative references */}
        {creativeReferences.length > 0 && (
          <div className="mb-16 lg:mb-20">
            <h3 className="text-xs font-medium tracking-[0.15em] uppercase text-text-muted mb-6">
              Creative References
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {creativeReferences.map((ref) => (
                <div key={ref.id} className="group">
                  <div className="aspect-[4/3] rounded-lg overflow-hidden bg-bg-secondary mb-2">
                    {ref.image_url ? (
                      <img
                        src={ref.image_url}
                        alt={ref.label}
                        className="w-full h-full object-cover transition-transform duration-decorative group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span
                          className="text-xs font-medium tracking-wider uppercase"
                          style={{ color: 'var(--org-primary)' }}
                        >
                          {ref.type}
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-sm font-medium text-foreground">{ref.label}</p>
                  {ref.description && (
                    <p className="text-xs text-text-muted mt-0.5">{ref.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Core deliverables */}
        {deliverables.length > 0 && (
          <div className="mb-16 lg:mb-20">
            <h3 className="text-xs font-medium tracking-[0.15em] uppercase text-text-muted mb-8">
              Core Deliverables
            </h3>
            <div className="grid gap-4 lg:gap-6">
              {deliverables.map((deliverable) => (
                <div
                  key={deliverable.id}
                  className="rounded-xl border border-border bg-background p-6 lg:p-8 transition-shadow hover:shadow-sm"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-lg font-medium text-foreground mb-1">
                        {deliverable.name}
                      </h4>
                      {deliverable.description && (
                        <p className="text-sm text-text-secondary leading-relaxed mb-4">
                          {deliverable.description}
                        </p>
                      )}
                      {deliverable.details.length > 0 && (
                        <ul className="space-y-1.5">
                          {deliverable.details.map((detail, i) => (
                            <li key={i} className="flex items-start gap-2.5 text-sm text-text-secondary">
                              <span
                                className="mt-1.5 h-1 w-1 rounded-full shrink-0"
                                style={{ backgroundColor: 'var(--org-primary)' }}
                              />
                              {detail}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="lg:text-right shrink-0">
                      <p className="text-2xl font-light tracking-tight text-foreground">
                        {formatCurrency(deliverable.total_cost, currency)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add-ons */}
        {addons.length > 0 && (
          <div className="mb-16 lg:mb-20">
            <h3 className="text-xs font-medium tracking-[0.15em] uppercase text-addon mb-8">
              Optional Enhancements
            </h3>
            <div className="grid gap-3 lg:gap-4">
              {addons.map((addon) => (
                <AddOnSelector
                  key={addon.id}
                  addon={addon}
                  selected={selectedAddonIds.has(addon.id)}
                  onToggle={() => onAddonToggle(addon)}
                  disabled={false}
                />
              ))}
            </div>
          </div>
        )}

        {/* Milestone gate */}
        {milestone && (
          <div className="mb-16 lg:mb-20">
            <MilestoneGateComponent
              milestone={milestone}
              requirements={milestone.requirements || []}
              onApprove={onMilestoneApprove}
            />
          </div>
        )}

        {/* Phase subtotal */}
        <div className="flex items-center justify-between pt-8 border-t border-border">
          <p className="text-sm font-medium tracking-[0.1em] uppercase text-text-muted">
            Phase {phase.phase_number} Investment
          </p>
          <p className="text-2xl lg:text-3xl font-light tracking-tight text-foreground">
            {formatCurrency(phaseSubtotal, currency)}
          </p>
        </div>
      </div>

      {/* Phase divider */}
      <div className="h-px bg-border" />
    </motion.section>
  );
}
