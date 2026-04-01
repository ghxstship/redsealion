'use client';

import { useState, useMemo } from 'react';
import BuilderStepIndicator from '@/components/admin/builder/BuilderStepIndicator';
import ProjectSetupStep, { type ProjectSetupData } from '@/components/admin/builder/ProjectSetupStep';
import VenueStep, { type VenueData } from '@/components/admin/builder/VenueStep';
import TeamStep, { type TeamAssignmentData } from '@/components/admin/builder/TeamStep';
import PhaseEditorStep, { type PhaseData } from '@/components/admin/builder/PhaseEditorStep';
import ReviewStep from '@/components/admin/builder/ReviewStep';

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
      requirements: [],
    },
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
  };
}

export default function NewProposalPage() {
  const [currentStep, setCurrentStep] = useState(0);

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

  const handleSendToClient = () => {
    alert('Proposal sent to client! (placeholder)');
  };

  const handleSaveAsDraft = () => {
    alert('Proposal saved as draft! (placeholder)');
  };

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
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          New Proposal
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Build your proposal step by step.
        </p>
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
