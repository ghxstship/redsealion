'use client';

import { useState, useMemo, use, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import BuilderStepIndicator from '@/components/admin/builder/BuilderStepIndicator';
import ProjectSetupStep, { type ProjectSetupData } from '@/components/admin/builder/ProjectSetupStep';
import VenueStep, { type VenueData } from '@/components/admin/builder/VenueStep';
import TeamStep, { type TeamAssignmentData } from '@/components/admin/builder/TeamStep';
import PhaseEditorStep, { type PhaseData } from '@/components/admin/builder/PhaseEditorStep';
import ReviewStep from '@/components/admin/builder/ReviewStep';
import { createClient } from '@/lib/supabase/client';

// Default empty state for a new proposal
function getEmptyState() {
  const projectSetup: ProjectSetupData = {
    clientId: '',
    clientSearch: '',
    projectName: '',
    subtitle: '',
    brandVoice: '',
    audienceProfile: '',
    experienceGoal: '',
    depositPercent: 50,
    balancePercent: 50,
    phaseTemplateId: '',
  };

  const venues: VenueData[] = [];
  const team: TeamAssignmentData[] = [];
  const phases: PhaseData[] = [
    {
      id: crypto.randomUUID(),
      number: '1',
      name: 'Phase 1',
      subtitle: '',
      narrative: '',
      deliverables: [],
      addons: [],
      milestone: { name: '', requirements: [] },
    },
  ];

  return { projectSetup, venues, team, phases };
}

export default function EditProposalBuilderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [organizationId, setOrganizationId] = useState('');
  const [userId, setUserId] = useState('');

  const emptyState = getEmptyState();
  const [projectSetup, setProjectSetup] = useState<ProjectSetupData>(emptyState.projectSetup);
  const [venues, setVenues] = useState<VenueData[]>(emptyState.venues);
  const [team, setTeam] = useState<TeamAssignmentData[]>(emptyState.team);
  const [phases, setPhases] = useState<PhaseData[]>(emptyState.phases);

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        setUserId(user.id);

        // Resolve org via organization_memberships (SSOT)
        const { data: membership } = await supabase
          .from('organization_memberships')
          .select('organization_id')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .limit(1)
          .single();
        if (membership) setOrganizationId(membership.organization_id as string);

        // Load proposal
        const { data: proposal } = await supabase
          .from('proposals')
          .select('*, clients(company_name)')
          .eq('id', id)
          .single();

        if (proposal) {
          const narr = proposal.narrative_context as Record<string, string> | null;
          const terms = proposal.payment_terms as Record<string, number> | null;

          setProjectSetup({
            clientId: proposal.client_id ?? '',
            clientSearch: (proposal.clients as Record<string, string>)?.company_name ?? '',
            projectName: proposal.name,
            subtitle: proposal.subtitle ?? '',
            brandVoice: narr?.brandVoice ?? '',
            audienceProfile: narr?.audienceProfile ?? '',
            experienceGoal: narr?.experienceGoal ?? '',
            depositPercent: terms?.depositPercent ?? 50,
            balancePercent: terms?.balancePercent ?? 50,
            phaseTemplateId: proposal.phase_template_id ?? '',
          });
        }

        // Load venues
        const { data: venueRows } = await supabase
          .from('venues')
          .select()
          .eq('proposal_id', id)
          .order('sequence');

        if (venueRows && venueRows.length > 0) {
          setVenues(
            venueRows.map((v: Record<string, unknown>) => ({
              id: v.id as string,
              name: v.name as string,
              address: (v.address ?? {}) as VenueData['address'],
              type: v.type as string,
              activationDates: (v.activation_dates ?? null) as VenueData['activationDates'],
              loadIn: (v.load_in ?? null) as VenueData['loadIn'],
              strike: (v.strike ?? null) as VenueData['strike'],
              hasLoadIn: !!v.load_in,
              hasStrike: !!v.strike,
              notes: (v.notes as string) ?? '',
            })),
          );
        }

        // Load team
        const { data: teamRows } = await supabase
          .from('team_assignments')
          .select()
          .eq('proposal_id', id);

        if (teamRows && teamRows.length > 0) {
          setTeam(
            teamRows.map((t: Record<string, unknown>) => ({
              id: t.id as string,
              role: t.role as string,
              userId: t.user_id as string,
              facilityId: (t.facility_id as string) ?? '',
            })),
          );
        }

        // Load phases with deliverables, addons, milestones
        const { data: phaseRows } = await supabase
          .from('phases')
          .select()
          .eq('proposal_id', id)
          .order('sort_order');

        if (phaseRows && phaseRows.length > 0) {
          const loadedPhases: PhaseData[] = [];

          for (const p of phaseRows) {
            // Deliverables
            const { data: delivRows } = await supabase
              .from('phase_deliverables')
              .select()
              .eq('phase_id', p.id)
              .order('sort_order');

            // Addons
            const { data: addonRows } = await supabase
              .from('phase_addons')
              .select()
              .eq('phase_id', p.id)
              .order('sort_order');

            // Milestones
            const { data: milestoneRows } = await supabase
              .from('milestone_gates')
              .select('*, milestone_requirements(*)')
              .eq('phase_id', p.id)
              .order('created_at')
              .limit(1);

            const milestone = milestoneRows?.[0];

            loadedPhases.push({
              id: p.id,
              number: p.phase_number,
              name: p.name,
              subtitle: p.subtitle ?? '',
              narrative: p.narrative ?? '',
              deliverables: (delivRows ?? []).map((d: Record<string, unknown>) => ({
                id: d.id as string,
                name: d.name as string,
                description: (d.description as string) ?? '',
                category: (d.category as string) ?? '',
                unit: (d.unit as string) ?? 'unit',
                qty: Number(d.qty) || 1,
                unitCost: Number(d.unit_cost) || 0,
                totalCost: Number(d.total_cost) || 0,
              })),
              addons: (addonRows ?? []).map((a: Record<string, unknown>) => ({
                id: a.id as string,
                name: a.name as string,
                description: (a.description as string) ?? '',
                category: (a.category as string) ?? '',
                unit: (a.unit as string) ?? 'unit',
                qty: Number(a.qty) || 1,
                unitCost: Number(a.unit_cost) || 0,
                totalCost: Number(a.total_cost) || 0,
                selected: (a.selected as boolean) ?? false,
                mutuallyExclusiveGroup: (a.mutually_exclusive_group as string) ?? '',
              })),
              milestone: {
                name: (milestone?.name as string) ?? '',
                requirements: (
                  (milestone?.milestone_requirements as Array<Record<string, unknown>>) ?? []
                ).map((r) => ({
                  id: r.id as string,
                  text: r.text as string,
                  assignee: (r.assignee as string ?? 'producer') as import('@/types/database').RequirementAssignee,
                })),
              },
            });
          }

          setPhases(loadedPhases);
        }
      } catch {
        // Leave empty state — user can create from scratch
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const steps = useMemo(() => {
    const phaseSteps = phases.map((p) => `Phase ${p.number}`);
    return ['Project Setup', 'Venues', 'Team', ...phaseSteps, 'Review'];
  }, [phases]);

  const totalSteps = steps.length;
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;

  const FIXED_BEFORE_PHASES = 3;
  const phaseStartIndex = FIXED_BEFORE_PHASES;
  const reviewIndex = phaseStartIndex + phases.length;

  const updatePhase = (phaseIndex: number, updatedPhase: PhaseData) => {
    setPhases((prev) => {
      const next = [...prev];
      next[phaseIndex] = updatedPhase;
      return next;
    });
  };

  const persistToSupabase = useCallback(
    async (newStatus: 'draft' | 'sent') => {
      if (!organizationId || !userId) return;
      setSaving(true);

      try {
        const supabase = createClient();

        // Calculate totals
        const totalValue = phases.reduce(
          (sum, phase) =>
            sum + phase.deliverables.reduce((s, d) => s + d.totalCost, 0),
          0,
        );
        const totalWithAddons =
          totalValue +
          phases.reduce(
            (sum, phase) =>
              sum +
              phase.addons
                .filter((a) => a.selected)
                .reduce((s, a) => s + a.totalCost, 0),
            0,
          );

        // Upsert proposal
        const { error: proposalError } = await supabase
          .from('proposals')
          .update({
            name: projectSetup.projectName,
            subtitle: projectSetup.subtitle || null,
            client_id: projectSetup.clientId || null,
            status: newStatus,
            total_value: totalValue,
            total_with_addons: totalWithAddons,
            narrative_context: {
              brandVoice: projectSetup.brandVoice,
              audienceProfile: projectSetup.audienceProfile,
              experienceGoal: projectSetup.experienceGoal,
            },
            payment_terms: {
              structure: `${projectSetup.depositPercent}/${projectSetup.balancePercent}`,
              depositPercent: projectSetup.depositPercent,
              balancePercent: projectSetup.balancePercent,
            },
            phase_template_id: projectSetup.phaseTemplateId || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id);

        if (proposalError) throw proposalError;

        // Delete existing child data for clean re-insert
        await supabase.from('venues').delete().eq('proposal_id', id);
        await supabase.from('team_assignments').delete().eq('proposal_id', id);

        // Re-insert venues
        if (venues.length > 0) {
          await supabase.from('venues').insert(
            venues.map((v, idx) => ({
              proposal_id: id,
              name: v.name,
              address: v.address,
              type: v.type,
              activation_dates: v.activationDates,
              load_in: v.hasLoadIn ? v.loadIn : null,
              strike: v.hasStrike ? v.strike : null,
              sequence: idx,
              notes: v.notes || null,
            })),
          );
        }

        // Re-insert team assignments
        if (team.length > 0) {
          await supabase.from('team_assignments').insert(
            team.map((t) => ({
              proposal_id: id,
              role: t.role,
              user_id: t.userId,
              facility_id: t.facilityId || null,
            })),
          );
        }

        // Phases: delete existing, then re-insert
        // First get existing phase IDs so cascading delete handles deliverables/addons/milestones
        await supabase.from('phases').delete().eq('proposal_id', id);

        for (let i = 0; i < phases.length; i++) {
          const phase = phases[i];
          const phaseInvestment = phase.deliverables.reduce(
            (sum, d) => sum + d.totalCost,
            0,
          );

          const { data: insertedPhase } = await supabase
            .from('phases')
            .insert({
              proposal_id: id,
              phase_number: phase.number,
              name: phase.name,
              subtitle: phase.subtitle || null,
              narrative: phase.narrative || null,
              phase_investment: phaseInvestment,
              sort_order: i,
            })
            .select('id')
            .single();

          if (!insertedPhase) continue;
          const phaseId = insertedPhase.id;

          // Insert deliverables
          if (phase.deliverables.length > 0) {
            await supabase.from('phase_deliverables').insert(
              phase.deliverables.map((d, dIdx) => ({
                phase_id: phaseId,
                name: d.name,
                description: d.description || null,
                category: d.category || 'service',
                unit: d.unit,
                qty: d.qty,
                unit_cost: d.unitCost,
                total_cost: d.totalCost,
                sort_order: dIdx,
              })),
            );
          }

          // Insert addons
          if (phase.addons.length > 0) {
            await supabase.from('phase_addons').insert(
              phase.addons.map((a, aIdx) => ({
                phase_id: phaseId,
                name: a.name,
                description: a.description || null,
                category: a.category || 'service',
                unit: a.unit,
                qty: a.qty,
                unit_cost: a.unitCost,
                total_cost: a.totalCost,
                selected: a.selected,
                mutually_exclusive_group: a.mutuallyExclusiveGroup || null,
                sort_order: aIdx,
              })),
            );
          }

          // Insert milestone
          if (phase.milestone.name) {
            const { data: insertedMilestone } = await supabase
              .from('milestone_gates')
              .insert({
                phase_id: phaseId,
                name: phase.milestone.name,
              })
              .select('id')
              .single();

            if (
              insertedMilestone &&
              phase.milestone.requirements.length > 0
            ) {
              await supabase.from('milestone_requirements').insert(
                phase.milestone.requirements.map((r, rIdx) => ({
                  milestone_id: insertedMilestone.id,
                  text: r.text,
                  assignee: r.assignee,
                  sort_order: rIdx,
                })),
              );
            }
          }
        }

        return true;
      } catch (err) {
        void 0; /* error handled silently in UI layer */
        return false;
      } finally {
        setSaving(false);
      }
    },
    [id, organizationId, userId, projectSetup, venues, team, phases],
  );

  const handleSendToClient = async () => {
    const ok = await persistToSupabase('sent');
    if (ok) {
      router.push(`/app/proposals/${id}`);
    }
  };

  const handleSaveAsDraft = async () => {
    const ok = await persistToSupabase('draft');
    if (ok) {
      router.push(`/app/proposals/${id}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-sm text-text-muted">Loading builder…</p>
      </div>
    );
  }

  const renderStep = () => {
    if (currentStep === 0) {
      return <ProjectSetupStep data={projectSetup} onChange={setProjectSetup} />;
    }
    if (currentStep === 1) {
      return <VenueStep venues={venues} onChange={setVenues} />;
    }
    if (currentStep === 2) {
      return <TeamStep assignments={team} onChange={setTeam} />;
    }
    if (currentStep >= phaseStartIndex && currentStep < reviewIndex) {
      const phaseIndex = currentStep - phaseStartIndex;
      return (
        <PhaseEditorStep
          phase={phases[phaseIndex]}
          onChange={(p) => updatePhase(phaseIndex, p)}
        />
      );
    }
    if (currentStep === reviewIndex) {
      return (
        <ReviewStep
          projectSetup={projectSetup}
          venues={venues}
          team={team}
          phases={phases}
          onSendToClient={handleSendToClient}
          onSaveAsDraft={handleSaveAsDraft}
        />
      );
    }
    return null;
  };

  return (
    <>
      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs text-text-muted mb-2">
          <span>Proposals</span>
          <span>/</span>
          <span>{projectSetup.projectName || id}</span>
          <span>/</span>
          <span>Builder</span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Edit Proposal
        </h1>
        {saving && (
          <p className="mt-1 text-sm text-blue-600 animate-pulse">
            Saving…
          </p>
        )}
      </div>

      {/* Step Indicator */}
      <div className="mb-8 rounded-xl border border-border bg-white px-5 py-4">
        <BuilderStepIndicator
          steps={steps}
          currentStep={currentStep}
          onStepClick={setCurrentStep}
        />
      </div>

      {/* Step Content */}
      <div className="rounded-xl border border-border bg-white px-6 py-6 md:px-8 md:py-8">
        {renderStep()}
      </div>

      {/* Navigation */}
      {currentStep !== reviewIndex && (
        <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            disabled={isFirstStep}
            onClick={() => setCurrentStep((s) => s - 1)}
            className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-text-secondary hover:bg-bg-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span className="text-xs text-text-muted">
            Step {currentStep + 1} of {totalSteps}
          </span>
          <button
            type="button"
            disabled={isLastStep}
            onClick={() => setCurrentStep((s) => s + 1)}
            className="rounded-lg bg-org-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-org-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </>
  );
}
