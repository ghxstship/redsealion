'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import BuilderStepIndicator from '@/components/admin/builder/BuilderStepIndicator';
import ProjectSetupStep, { type ProjectSetupData } from '@/components/admin/builder/ProjectSetupStep';
import VenueStep, { type VenueData } from '@/components/admin/builder/VenueStep';
import TeamStep, { type TeamAssignmentData } from '@/components/admin/builder/TeamStep';
import PhaseEditorStep, { type PhaseData } from '@/components/admin/builder/PhaseEditorStep';
import ReviewStep from '@/components/admin/builder/ReviewStep';
import PageHeader from '@/components/shared/PageHeader';
import Card from '@/components/ui/Card';
import Skeleton from '@/components/ui/Skeleton';

function createDefaultPhase(number: number): PhaseData {
  const phaseNames: Record<number, { name: string; subtitle: string }> = {
    1: { name: 'Discovery & Strategy', subtitle: 'Understanding your vision' },
    2: { name: 'Concept Development', subtitle: 'Bringing ideas to life' },
    3: { name: 'Design & Engineering', subtitle: 'Detailed design specifications' },
    4: { name: 'Fabrication & Production', subtitle: 'Building your experience' },
    5: { name: 'Technology Integration', subtitle: 'Digital and interactive elements' },
    6: { name: 'Logistics & Shipping', subtitle: 'Getting everything on-site' },
    7: { name: 'Installation & Activation', subtitle: 'Setting up for success' },
    8: { name: 'Strike & Wrap', subtitle: 'Clean deinstallation and reporting' },
  };

  const defaults = phaseNames[number] ?? {
    name: `Phase ${number}`,
    subtitle: '',
  };

  return {
    id: crypto.randomUUID(),
    number: String(number),
    name: defaults.name,
    subtitle: defaults.subtitle,
    narrative: '',
    deliverables: [],
    addons: [],
    milestone: {
      name: '',
      unlocks: '',
      requirements: [],
    },
    creativeRefs: [],
    portfolioLinks: [],
    termsSections: [],
  };
}

const DEFAULT_PHASE_COUNT = 8;

function initialProjectSetup(): ProjectSetupData {
  return {
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
    assumptions: [],
  };
}

export default function NewProposalPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Form state
  const [projectSetup, setProjectSetup] = useState<ProjectSetupData>(initialProjectSetup);
  const [venues, setVenues] = useState<VenueData[]>([]);
  const [team, setTeam] = useState<TeamAssignmentData[]>([]);
  const [phases, setPhases] = useState<PhaseData[]>(
    Array.from({ length: DEFAULT_PHASE_COUNT }, (_, i) => createDefaultPhase(i + 1))
  );

  // Dynamic steps: Project Setup, Venues, Team, Phase 1..N, Review
  const steps = useMemo(() => {
    const phaseSteps = phases.map((p) => `Phase ${p.number}`);
    return ['Project Setup', 'Venues', 'Team', ...phaseSteps, 'Review'];
  }, [phases]);

  const totalSteps = steps.length;
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;

  // Map currentStep to what we render
  const FIXED_BEFORE_PHASES = 3; // Project Setup=0, Venues=1, Team=2
  const phaseStartIndex = FIXED_BEFORE_PHASES;
  const reviewIndex = phaseStartIndex + phases.length;

  const updatePhase = (phaseIndex: number, updatedPhase: PhaseData) => {
    setPhases((prev) => {
      const next = [...prev];
      next[phaseIndex] = updatedPhase;
      return next;
    });
  };

  async function saveProposal(status: 'draft' | 'sent') {
    setSaving(true);
    setSaveError(null);

    try {
      const res = await fetch('/api/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectSetup, venues, phases, team, status }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSaveError(data.error ?? 'Failed to save proposal.');
        return;
      }

      // Redirect to the new proposal detail page
      router.push(`/app/proposals/${data.id}`);
    } catch {
      setSaveError('An unexpected error occurred. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  const handleSendToClient = () => saveProposal('sent');
  const handleSaveAsDraft = () => saveProposal('draft');

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
<PageHeader
        title="New Proposal"
        subtitle="Build your proposal step by step."
      />

      {/* Step Indicator */}
      <div className="mb-8 rounded-xl border border-border bg-background px-5 py-4">
        <BuilderStepIndicator
          steps={steps}
          currentStep={currentStep}
          onStepClick={setCurrentStep}
        />
      </div>

      {/* Step Content */}
      <Card className="md:px-8 md:py-8">
        {renderStep()}
      </Card>

      {/* Save error */}
      {saveError && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {saveError}
        </div>
      )}

      {/* Saving overlay */}
      {saving && (
        <div className="mt-4 text-center text-sm text-text-muted animate-pulse">
          Saving proposal...
        </div>
      )}

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
