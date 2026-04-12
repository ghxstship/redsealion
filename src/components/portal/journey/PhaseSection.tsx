'use client';

import { useRef, useState } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { fmTransition } from '@/lib/motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { formatCurrency } from '@/lib/utils';
import type {
  Phase,
  PhaseDeliverable,
  PhaseAddon,
  MilestoneGate as MilestoneGateType,
  MilestoneRequirement,
  CreativeReference,
  PhasePortfolioLink,
} from '@/types/database';
import AddOnSelector from './AddOnSelector';
import MilestoneGateComponent from './MilestoneGate';
import { ChevronDown, MessageSquare, ExternalLink, BookOpen } from 'lucide-react';
import FormInput from '@/components/ui/FormInput';
import Button from '@/components/ui/Button';

interface PhaseSectionProps {
  phase: Phase;
  deliverables: PhaseDeliverable[];
  addons: PhaseAddon[];
  milestone: (MilestoneGateType & { requirements?: MilestoneRequirement[] }) | null;
  creativeReferences: CreativeReference[];
  portfolioLinks?: (PhasePortfolioLink & { project_name?: string })[];
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
  portfolioLinks = [],
  selectedAddonIds,
  onAddonToggle,
  onMilestoneApprove,
  currency = 'USD',
}: PhaseSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  const prefersReduced = useReducedMotion();
  const [expandedDeliverable, setExpandedDeliverable] = useState<string | null>(null);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentText, setCommentText] = useState('');

  const phaseSubtotal = deliverables.reduce((sum, d) => sum + d.total_cost, 0);
  const termsSections = ((phase.terms_sections as string[]) ?? []);

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

        {/* Portfolio & Precedent Work */}
        {portfolioLinks.length > 0 && (
          <div className="mb-16 lg:mb-20">
            <h3 className="text-xs font-medium tracking-[0.15em] uppercase text-amber-600 mb-6">
              Portfolio & Precedent Work
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {portfolioLinks.map((link) => (
                <div
                  key={link.id}
                  className="rounded-xl border border-amber-200 bg-amber-50/30 p-5 transition-shadow hover:shadow-sm group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-sm font-medium text-foreground">
                      {link.project_name ?? `Portfolio #${link.portfolio_item_id.slice(0, 8)}`}
                    </p>
                    <ExternalLink size={14} className="text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5" />
                  </div>
                  {link.context_description && (
                    <p className="text-xs text-text-secondary leading-relaxed">
                      {link.context_description}
                    </p>
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
                      <div className="flex items-center gap-2">
                        <h4 className="text-lg font-medium text-foreground mb-1">
                          {deliverable.name}
                        </h4>
                        {(deliverable.details as string[] ?? []).length > 0 && (
                          <Button
                            type="button"
                            onClick={() => setExpandedDeliverable(
                              expandedDeliverable === deliverable.id ? null : deliverable.id,
                            )}
                            className="p-0.5 text-text-muted hover:text-foreground transition-colors"
                          >
                            <ChevronDown
                              size={14}
                              className={`transition-transform ${expandedDeliverable === deliverable.id ? 'rotate-180' : ''}`}
                            />
                          </Button>
                        )}
                      </div>
                      {deliverable.description && (
                        <p className="text-sm text-text-secondary leading-relaxed mb-4">
                          {deliverable.description}
                        </p>
                      )}

                      {/* Expandable details */}
                      <AnimatePresence>
                        {expandedDeliverable === deliverable.id && (deliverable.details as string[] ?? []).length > 0 && (
                          <motion.ul
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={fmTransition.enter}
                            className="space-y-1.5 overflow-hidden"
                          >
                            {(deliverable.details as string[]).map((detail, i) => (
                              <li key={i} className="flex items-start gap-2.5 text-sm text-text-secondary">
                                <span
                                  className="mt-1.5 h-1 w-1 rounded-full shrink-0"
                                  style={{ backgroundColor: 'var(--org-primary)' }}
                                />
                                {detail}
                              </li>
                            ))}
                          </motion.ul>
                        )}
                      </AnimatePresence>
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

        {/* Per-phase terms callout */}
        {termsSections.length > 0 && (
          <div className="mb-16 lg:mb-20">
            <div className="rounded-xl border border-purple-200 bg-purple-50/30 p-5 flex items-start gap-3">
              <BookOpen size={16} className="text-purple-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-medium tracking-wider uppercase text-purple-600 mb-1">
                  Contractual Framework
                </p>
                <p className="text-sm text-text-secondary">
                  Governing sections: {termsSections.map((s) => `§${s}`).join(', ')}
                </p>
              </div>
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

        {/* Inline comment */}
        <div className="mt-8 pt-6 border-t border-border/50">
          {!showCommentInput ? (
            <Button
              type="button"
              onClick={() => setShowCommentInput(true)}
              className="flex items-center gap-2 text-xs text-text-muted hover:text-text-secondary transition-colors"
            >
              <MessageSquare size={13} />
              Add a comment on this phase
            </Button>
          ) : (
            <div className="flex gap-3">
              <FormInput
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Leave a comment or question…"
                className="flex-1 rounded-lg border border-border bg-bg-secondary/30 px-3 py-2 text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-org-primary/30"
                autoFocus
              />
              <Button
                type="button"
                disabled
                className="rounded-lg px-4 py-2 text-xs font-medium text-white opacity-50 cursor-not-allowed"
                style={{ backgroundColor: 'var(--org-primary)' }}
                title="Client commenting coming soon"
              >
                Send
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setCommentText('');
                  setShowCommentInput(false);
                }}
                className="text-xs text-text-muted hover:text-text-secondary transition-colors"
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Phase divider */}
      <div className="h-px bg-border" />
    </motion.section>
  );
}
