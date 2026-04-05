'use client';

import { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { fmTransition } from '@/lib/motion';
import type {
  Phase,
  PhaseDeliverable,
  PhaseAddon,
  MilestoneGate,
  MilestoneRequirement,
  CreativeReference,
  PaymentTerms,
} from '@/types/database';
import PhaseSection from './PhaseSection';
import JourneyTimeline from './JourneyTimeline';
import InvestmentSummaryBar from './InvestmentSummaryBar';

interface PhaseData {
  phase: Phase;
  deliverables: PhaseDeliverable[];
  addons: PhaseAddon[];
  milestone: (MilestoneGate & { requirements?: MilestoneRequirement[] }) | null;
  creativeReferences: CreativeReference[];
}

interface JourneyContentProps {
  proposalId: string;
  proposalName: string;
  proposalSubtitle: string | null;
  phases: PhaseData[];
  paymentTerms: PaymentTerms | null;
  currency?: string;
  currentPhaseId: string | null;
}

export default function JourneyContent({
  proposalId,
  proposalName,
  proposalSubtitle,
  phases,
  paymentTerms,
  currency = 'USD',
  currentPhaseId,
}: JourneyContentProps) {
  // Track selected addons
  const [selectedAddonIds, setSelectedAddonIds] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    for (const p of phases) {
      for (const addon of p.addons) {
        if (addon.is_selected) initial.add(addon.id);
      }
    }
    return initial;
  });

  // Build addon lookup for mutual exclusion
  const addonMap = useMemo(() => {
    const map = new Map<string, PhaseAddon>();
    for (const p of phases) {
      for (const addon of p.addons) {
        map.set(addon.id, addon);
      }
    }
    return map;
  }, [phases]);

  const handleAddonToggle = useCallback(
    (addon: PhaseAddon) => {
      setSelectedAddonIds((prev) => {
        const next = new Set(prev);
        if (next.has(addon.id)) {
          next.delete(addon.id);
        } else {
          // Handle mutual exclusion
          if (addon.mutually_exclusive_group) {
            for (const [id, a] of addonMap) {
              if (
                a.mutually_exclusive_group === addon.mutually_exclusive_group &&
                a.phase_id === addon.phase_id &&
                id !== addon.id
              ) {
                next.delete(id);
              }
            }
          }
          next.add(addon.id);
        }
        return next;
      });
    },
    [addonMap]
  );

  // Calculate totals
  const coreTotal = useMemo(
    () =>
      phases.reduce(
        (sum, p) =>
          sum + p.deliverables.reduce((ds, d) => ds + d.total_cost, 0),
        0
      ),
    [phases]
  );

  const addonTotal = useMemo(
    () =>
      Array.from(selectedAddonIds).reduce((sum, id) => {
        const addon = addonMap.get(id);
        return sum + (addon?.total_cost ?? 0);
      }, 0),
    [selectedAddonIds, addonMap]
  );

  const handleMilestoneApprove = useCallback(
    async (milestoneId: string, requirementId: string) => {
      try {
        await fetch(`/api/proposals/${proposalId}/milestones/${milestoneId}/requirements/${requirementId}/approve`, {
          method: 'POST',
        });
      } catch {
        // Silently fail — UI can be enhanced with error toast later
      }
    },
    [proposalId]
  );

  const handleAccept = useCallback(async () => {
    try {
      await fetch(`/api/proposals/${proposalId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedAddonIds: Array.from(selectedAddonIds),
          signature_data: 'accepted_via_portal',
        }),
      });
    } catch {
      // Silently fail — UI can be enhanced with error toast later
    }
  }, [proposalId, selectedAddonIds]);

  const timelinePhases = phases.map((p) => ({
    id: p.phase.id,
    phase_number: p.phase.phase_number,
    name: p.phase.name,
    status: p.phase.status,
  }));

  return (
    <div className="relative">
      {/* Timeline */}
      <JourneyTimeline
        phases={timelinePhases}
        currentPhaseId={currentPhaseId}
      />

      {/* Hero */}
      <div className="lg:pr-80 xl:pr-96">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...fmTransition.slow, delay: 0.1 }}
          className="pt-16 lg:pt-24 pb-12 lg:pb-16 px-6 lg:px-8 max-w-4xl"
        >
          <p
            className="text-xs font-medium tracking-[0.25em] uppercase mb-4"
            style={{ color: 'var(--org-primary)' }}
          >
            Experience Proposal
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light tracking-tight text-foreground leading-[1.1] mb-4">
            {proposalName}
          </h1>
          {proposalSubtitle && (
            <p className="text-lg lg:text-xl text-text-secondary font-light max-w-2xl">
              {proposalSubtitle}
            </p>
          )}
        </motion.div>

        {/* Phase sections */}
        <div className="px-6 lg:px-8 max-w-4xl">
          {phases.map((phaseData) => (
            <PhaseSection
              key={phaseData.phase.id}
              phase={phaseData.phase}
              deliverables={phaseData.deliverables}
              addons={phaseData.addons}
              milestone={phaseData.milestone}
              creativeReferences={phaseData.creativeReferences}
              selectedAddonIds={selectedAddonIds}
              onAddonToggle={handleAddonToggle}
              onMilestoneApprove={handleMilestoneApprove}
              currency={currency}
            />
          ))}
        </div>

        {/* Bottom spacer for mobile sticky bar */}
        <div className="h-32 lg:h-0" />
      </div>

      {/* Investment Summary */}
      <InvestmentSummaryBar
        coreTotal={coreTotal}
        addonTotal={addonTotal}
        paymentTerms={paymentTerms}
        currency={currency}
        onAccept={handleAccept}
      />
    </div>
  );
}
