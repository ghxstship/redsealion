'use client';

import { useState, useMemo, use } from 'react';
import BuilderStepIndicator from '@/components/admin/builder/BuilderStepIndicator';
import ProjectSetupStep, { type ProjectSetupData } from '@/components/admin/builder/ProjectSetupStep';
import VenueStep, { type VenueData } from '@/components/admin/builder/VenueStep';
import TeamStep, { type TeamAssignmentData } from '@/components/admin/builder/TeamStep';
import PhaseEditorStep, { type PhaseData } from '@/components/admin/builder/PhaseEditorStep';
import ReviewStep from '@/components/admin/builder/ReviewStep';

// Seed data for an existing proposal
function getSeedProposal() {
  const projectSetup: ProjectSetupData = {
    clientId: 'client-3',
    clientSearch: 'Stark Events Group',
    projectName: 'SXSW 2026 Brand Activation',
    subtitle: 'Immersive Pop-Up Experience',
    brandVoice: 'Bold, innovative, cutting-edge. Speak to a tech-savvy audience with confidence.',
    audienceProfile: 'Tech professionals, early adopters, and media influencers aged 25-45.',
    experienceGoal: 'Create an unforgettable branded moment that drives social sharing and earned media.',
    depositPercent: 50,
    balancePercent: 50,
    phaseTemplateId: 'tpl-1',
  };

  const venues: VenueData[] = [
    {
      id: 'venue-1',
      name: 'Austin Convention Center',
      address: {
        street: '500 E Cesar Chavez St',
        city: 'Austin',
        state: 'TX',
        zip: '78701',
        country: 'US',
      },
      type: 'Convention Center',
      activationDates: { start: '2026-03-13', end: '2026-03-17' },
      loadIn: { date: '2026-03-12', startTime: '08:00', endTime: '18:00' },
      strike: { date: '2026-03-18', startTime: '06:00', endTime: '14:00' },
      hasLoadIn: true,
      hasStrike: true,
      notes: 'Loading dock at rear. 15ft ceiling clearance. Union labor required.',
    },
  ];

  const team: TeamAssignmentData[] = [
    { id: 'ta-1', role: 'Account Lead', userId: 'user-5', facilityId: 'fac-1' },
    { id: 'ta-2', role: 'Project Manager', userId: 'user-1', facilityId: 'fac-1' },
    { id: 'ta-3', role: 'Design Lead', userId: 'user-2', facilityId: 'fac-3' },
    { id: 'ta-4', role: 'Fabrication Lead', userId: 'user-3', facilityId: 'fac-2' },
    { id: 'ta-5', role: 'Install Lead', userId: 'user-4', facilityId: 'fac-2' },
  ];

  const phases: PhaseData[] = [
    {
      id: 'phase-1',
      number: '1',
      name: 'Discovery & Strategy',
      subtitle: 'Understanding your vision',
      narrative: 'We begin every project with a deep dive into your brand, goals, and audience. This phase includes stakeholder interviews, competitive analysis, and strategic planning to ensure every element of the experience aligns with your objectives.',
      deliverables: [
        {
          id: 'del-1',
          name: 'Stakeholder Interviews',
          description: 'In-depth sessions with key decision makers',
          category: 'Management',
          unit: 'hour',
          qty: 8,
          unitCost: 250,
          totalCost: 2000,
        },
        {
          id: 'del-2',
          name: 'Strategy Document',
          description: 'Comprehensive brand activation strategy',
          category: 'Management',
          unit: 'unit',
          qty: 1,
          unitCost: 5000,
          totalCost: 5000,
        },
      ],
      addons: [
        {
          id: 'addon-1',
          name: 'Competitive Analysis Report',
          description: 'Detailed analysis of competitor activations at SXSW',
          category: 'Management',
          unit: 'unit',
          qty: 1,
          unitCost: 3500,
          totalCost: 3500,
          selected: false,
          mutuallyExclusiveGroup: '',
        },
      ],
      milestone: {
        name: 'Strategy Approval',
        requirements: [
          { id: 'req-1', text: 'Strategy document reviewed and approved', assignee: 'client' },
          { id: 'req-2', text: 'Budget parameters confirmed', assignee: 'both' },
        ],
      },
    },
    {
      id: 'phase-2',
      number: '2',
      name: 'Concept Development',
      subtitle: 'Bringing ideas to life',
      narrative: 'Our creative team develops multiple concept directions based on the approved strategy. Each concept includes visual renderings, spatial layouts, and experience flow diagrams.',
      deliverables: [
        {
          id: 'del-3',
          name: '3D Renderings',
          description: 'Photorealistic renderings of the activation space',
          category: 'Design',
          unit: 'each',
          qty: 6,
          unitCost: 1500,
          totalCost: 9000,
        },
        {
          id: 'del-4',
          name: 'Floor Plan & Layout',
          description: 'Detailed spatial design with traffic flow',
          category: 'Design',
          unit: 'unit',
          qty: 1,
          unitCost: 4000,
          totalCost: 4000,
        },
      ],
      addons: [],
      milestone: {
        name: 'Concept Approval',
        requirements: [
          { id: 'req-3', text: 'Final concept direction selected', assignee: 'client' },
          { id: 'req-4', text: 'Deposit invoice paid', assignee: 'client' },
        ],
      },
    },
  ];

  // Add remaining phases as empty defaults
  for (let i = 3; i <= 8; i++) {
    const phaseNames: Record<number, { name: string; subtitle: string }> = {
      3: { name: 'Design & Engineering', subtitle: 'Detailed design specifications' },
      4: { name: 'Fabrication & Production', subtitle: 'Building your experience' },
      5: { name: 'Technology Integration', subtitle: 'Digital and interactive elements' },
      6: { name: 'Logistics & Shipping', subtitle: 'Getting everything on-site' },
      7: { name: 'Installation & Activation', subtitle: 'Setting up for success' },
      8: { name: 'Strike & Wrap', subtitle: 'Clean deinstallation and reporting' },
    };
    const defaults = phaseNames[i] ?? { name: `Phase ${i}`, subtitle: '' };
    phases.push({
      id: `phase-${i}`,
      number: String(i),
      name: defaults.name,
      subtitle: defaults.subtitle,
      narrative: '',
      deliverables: [],
      addons: [],
      milestone: { name: '', requirements: [] },
    });
  }

  return { projectSetup, venues, team, phases };
}

export default function EditProposalBuilderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  // Load seed data
  const seed = getSeedProposal();

  const [currentStep, setCurrentStep] = useState(0);
  const [projectSetup, setProjectSetup] = useState<ProjectSetupData>(seed.projectSetup);
  const [venues, setVenues] = useState<VenueData[]>(seed.venues);
  const [team, setTeam] = useState<TeamAssignmentData[]>(seed.team);
  const [phases, setPhases] = useState<PhaseData[]>(seed.phases);

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

  const handleSendToClient = () => {
    alert(`Proposal ${id} sent to client! (placeholder)`);
  };

  const handleSaveAsDraft = () => {
    alert(`Proposal ${id} saved as draft! (placeholder)`);
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
        <p className="mt-1 text-sm text-text-secondary">
          Editing proposal <span className="font-mono text-xs">{id}</span>
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
