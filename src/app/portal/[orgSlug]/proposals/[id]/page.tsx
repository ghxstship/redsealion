import type { Metadata } from 'next';
import JourneyContent from '@/components/portal/journey/JourneyContent';
import type {
  Phase,
  PhaseDeliverable,
  PhaseAddon,
  MilestoneGate,
  MilestoneRequirement,
  CreativeReference,
  PaymentTerms,
} from '@/types/database';

interface PageProps {
  params: Promise<{ orgSlug: string; id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { orgSlug } = await params;
  const orgName = orgSlug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  return {
    title: `Nike Air Max Day Experience | ${orgName}`,
  };
}

// ---------------------------------------------------------------------------
// Seed / mock data — Nike Air Max Day Experience
// ---------------------------------------------------------------------------

const ts = '2026-01-15T00:00:00Z';

function makePhase(
  number: string,
  name: string,
  subtitle: string,
  narrative: string,
  investment: number,
  status: Phase['status'] = 'not_started',
  sortOrder: number = parseInt(number)
): Phase {
  return {
    id: `phase-${number}`,
    proposal_id: 'proposal-1',
    number,
    name,
    subtitle,
    status,
    terms_sections: [],
    narrative,
    phase_investment: investment,
    sort_order: sortOrder,
    created_at: ts,
    updated_at: ts,
  };
}

function makeDeliverable(
  phaseId: string,
  id: string,
  name: string,
  description: string,
  details: string[],
  totalCost: number,
  category: string = 'production',
  sortOrder: number = 0
): PhaseDeliverable {
  return {
    id,
    phase_id: phaseId,
    name,
    description,
    details,
    category,
    unit: 'fixed',
    qty: 1,
    unit_cost: totalCost,
    total_cost: totalCost,
    taxable: true,
    terms_sections: null,
    pm_metadata: null,
    asset_metadata: null,
    resource_metadata: null,
    sort_order: sortOrder,
    created_at: ts,
    updated_at: ts,
  };
}

function makeAddon(
  phaseId: string,
  id: string,
  name: string,
  description: string,
  totalCost: number,
  group: string | null = null,
  selected = false
): PhaseAddon {
  return {
    id,
    phase_id: phaseId,
    name,
    description,
    category: 'enhancement',
    unit: 'fixed',
    qty: 1,
    unit_cost: totalCost,
    total_cost: totalCost,
    taxable: true,
    selected,
    terms_sections: null,
    mutually_exclusive_group: group,
    pm_metadata: null,
    asset_metadata: null,
    resource_metadata: null,
    sort_order: 0,
    created_at: ts,
    updated_at: ts,
  };
}

function makeMilestone(
  phaseId: string,
  name: string,
  unlocks: string,
  reqs: { text: string; assignee: MilestoneRequirement['assignee'] }[]
): MilestoneGate & { requirements: MilestoneRequirement[] } {
  return {
    id: `milestone-${phaseId}`,
    phase_id: phaseId,
    name,
    unlocks_description: unlocks,
    status: 'pending',
    completed_at: null,
    created_at: ts,
    updated_at: ts,
    requirements: reqs.map((r, i) => ({
      id: `req-${phaseId}-${i}`,
      milestone_id: `milestone-${phaseId}`,
      text: r.text,
      status: 'pending' as const,
      assignee: r.assignee,
      due_offset: null,
      due_date: null,
      completed_at: null,
      completed_by: null,
      finance_trigger: null,
      evidence_required: false,
      sort_order: i,
      created_at: ts,
      updated_at: ts,
    })),
  };
}

function makeRef(
  phaseId: string,
  id: string,
  label: string,
  type: CreativeReference['type'],
  description: string | null = null
): CreativeReference {
  return {
    id,
    phase_id: phaseId,
    label,
    description,
    type,
    image_url: null,
    sort_order: 0,
    created_at: ts,
    updated_at: ts,
  };
}

// --- Phases ---

const phase1 = makePhase(
  '1',
  'Discovery',
  'Understanding the vision',
  'We begin by immersing ourselves in the Nike Air Max legacy and the specific ambitions for this activation. Through stakeholder interviews, site analysis, and audience profiling, we develop a shared creative brief that will guide every decision downstream. This is where strategy meets imagination.',
  28000,
  'complete'
);

const phase2 = makePhase(
  '2',
  'Design',
  'Shaping the experience',
  'Our design team translates the creative brief into a fully realized spatial and experiential concept. From 3D walkthroughs to material studies, every touchpoint is considered. The result is a comprehensive design package that captures the energy of Air Max Day while delivering on brand objectives.',
  65000,
  'approved'
);

const phase3 = makePhase(
  '3',
  'Engineering',
  'Precision meets ambition',
  'Our engineering team takes the approved design and develops detailed production drawings, structural calculations, and technical specifications. Every element is engineered for safety, durability, and visual impact. We solve the hard problems before they reach the fabrication floor.',
  42000,
  'in_progress'
);

const phase4 = makePhase(
  '4',
  'Fabrication',
  'Bringing it to life',
  'Across our fabrication facilities, skilled artisans and advanced CNC machinery bring every element to life. Custom metalwork, precision-cut foam structures, LED integration, and hand-finished details transform raw materials into an experience-ready installation. Rigorous quality control ensures every piece meets our exacting standards.',
  185000,
  'not_started'
);

const phase5 = makePhase(
  '5',
  'Technology',
  'Digital meets physical',
  'Our technology team develops the interactive layers that elevate the experience beyond static installation. From RFID-triggered content to real-time social media integration, every digital touchpoint is designed to deepen engagement and generate shareable moments.',
  58000,
  'not_started'
);

const phase6 = makePhase(
  '6',
  'Logistics',
  'Orchestrating the move',
  'We coordinate the precise choreography of transporting, staging, and delivering every component to the venue. Our logistics team manages freight, customs (where applicable), climate-controlled storage, and detailed load-in sequencing to ensure nothing is left to chance.',
  32000,
  'not_started'
);

const phase7 = makePhase(
  '7',
  'Installation & Activation',
  'The moment arrives',
  'Our installation crew brings the full vision to life on-site. From structural assembly to final lighting calibration, every detail is executed with precision. We manage the load-in schedule, coordinate with venue operations, and conduct a comprehensive walkthrough before doors open. On activation day, our team is on-site to ensure flawless execution.',
  78000,
  'not_started'
);

const phase8 = makePhase(
  '8',
  'Strike & Close',
  'Clean departure, lasting impact',
  'After the final guest departs, our strike team efficiently disassembles, packages, and removes every element. We leave the venue in pristine condition, catalog all reusable assets, and deliver a comprehensive post-event report including engagement metrics, media coverage analysis, and recommendations for future activations.',
  22000,
  'not_started'
);

const phases = [phase1, phase2, phase3, phase4, phase5, phase6, phase7, phase8];

// --- Deliverables ---

const deliverables: Record<string, PhaseDeliverable[]> = {
  'phase-1': [
    makeDeliverable('phase-1', 'd1-1', 'Stakeholder Discovery Sessions', 'Three facilitated workshops with Nike brand, marketing, and retail teams to align on objectives, audience, and success metrics.', ['Two-hour sessions with key stakeholders', 'Audience persona development', 'Competitive landscape review', 'Success metrics framework'], 12000, 'strategy'),
    makeDeliverable('phase-1', 'd1-2', 'Site Analysis & Feasibility Study', 'Comprehensive venue assessment including structural load analysis, power mapping, and spatial planning for the Portland Pioneer Courthouse Square activation.', ['On-site survey and measurement', 'Structural load assessment', 'Power and data infrastructure audit', 'Permitting requirements review'], 8000, 'planning'),
    makeDeliverable('phase-1', 'd1-3', 'Creative Brief', 'A detailed creative strategy document synthesizing all discovery findings into a clear, actionable brief that guides design and production.', ['Brand alignment matrix', 'Experience narrative arc', 'Audience journey mapping', 'KPI definitions'], 8000, 'strategy'),
  ],
  'phase-2': [
    makeDeliverable('phase-2', 'd2-1', 'Concept Development', 'Three distinct creative directions exploring different approaches to the Air Max Day theme, each with mood boards, rough spatial layouts, and experience narratives.', ['Three concept directions with mood boards', 'Rough spatial layouts and flow diagrams', 'Material and finish palettes', 'Preliminary interactive experience concepts'], 22000, 'design'),
    makeDeliverable('phase-2', 'd2-2', '3D Design Package', 'Fully rendered 3D visualization of the selected concept, including spatial design, material specifications, lighting design, and guest journey mapping.', ['Photorealistic 3D renderings (12 views)', 'Animated walkthrough video', 'Material and finish specification book', 'Lighting design plan with fixture schedule'], 28000, 'design'),
    makeDeliverable('phase-2', 'd2-3', 'Graphic Design Package', 'All two-dimensional graphic elements including signage, way-finding, branded surfaces, and digital content templates.', ['Large-format graphic designs', 'Wayfinding and signage system', 'Digital screen content templates', 'Social media moment backdrops'], 15000, 'design'),
  ],
  'phase-3': [
    makeDeliverable('phase-3', 'd3-1', 'Structural Engineering', 'Detailed structural drawings and calculations for all custom-built elements, ensuring code compliance and safety.', ['PE-stamped structural drawings', 'Load calculations and safety factors', 'Connection detail drawings', 'Foundation and anchoring specifications'], 18000, 'engineering'),
    makeDeliverable('phase-3', 'd3-2', 'Electrical & Lighting Engineering', 'Complete electrical design including power distribution, lighting control systems, and AV infrastructure.', ['Electrical single-line diagrams', 'Lighting control programming', 'Power distribution plan', 'AV signal flow diagrams'], 14000, 'engineering'),
    makeDeliverable('phase-3', 'd3-3', 'Production Drawings', 'Shop-ready fabrication drawings for all custom elements with full dimensions, materials, and assembly sequences.', ['CNC-ready cut files', 'Assembly sequence drawings', 'Hardware and fastener schedules', 'Finish specification callouts'], 10000, 'engineering'),
  ],
  'phase-4': [
    makeDeliverable('phase-4', 'd4-1', 'Primary Structure Fabrication', 'Custom steel and aluminum framework forming the 40-foot Air Max sole silhouette centerpiece, with integrated mounting systems for all graphic and lighting elements.', ['CNC-cut steel primary structure', 'Powder-coated aluminum cladding panels', 'Integrated cable management', 'Modular connection system for transport'], 72000, 'fabrication'),
    makeDeliverable('phase-4', 'd4-2', 'Interactive Pods', 'Four freestanding interactive experience pods with custom millwork, integrated displays, and RFID readers.', ['CNC-routed MDF and acrylic shells', 'Integrated 55-inch touchscreen displays', 'RFID reader housings and wiring', 'LED accent lighting per pod'], 48000, 'fabrication'),
    makeDeliverable('phase-4', 'd4-3', 'Environmental Graphics Production', 'Large-format print production for all branded surfaces, including tension fabric graphics, vinyl applications, and dimensional lettering.', ['Tension fabric graphics (8 panels)', 'Floor vinyl application graphics', 'Dimensional foam and acrylic letters', 'Backlit translucent panels'], 35000, 'fabrication'),
    makeDeliverable('phase-4', 'd4-4', 'Lighting Package Fabrication', 'Custom LED fixtures, programmable lighting controllers, and all cable assemblies.', ['Custom RGB LED strip assemblies', 'Programmable DMX controllers', 'Spot and wash fixture preparation', 'Complete cable assemblies and connectors'], 30000, 'fabrication'),
  ],
  'phase-5': [
    makeDeliverable('phase-5', 'd5-1', 'Interactive Experience Development', 'Custom software for four interactive pods enabling product exploration, AR try-on, and social content creation.', ['Product explorer application (4 pods)', 'AR try-on experience integration', 'Social sharing and photo booth flow', 'Admin dashboard for content management'], 32000, 'technology'),
    makeDeliverable('phase-5', 'd5-2', 'RFID & Data Integration', 'End-to-end RFID system for personalized guest journeys, connecting physical interactions to digital experiences.', ['RFID wristband programming system', 'Reader integration across touchpoints', 'Guest journey data pipeline', 'Real-time analytics dashboard'], 18000, 'technology'),
    makeDeliverable('phase-5', 'd5-3', 'Content Management System', 'A lightweight CMS allowing the Nike team to update digital content, schedules, and messaging in real time.', ['Web-based content admin panel', 'Scheduled content rotation', 'Emergency messaging override', 'Post-event data export tools'], 8000, 'technology'),
  ],
  'phase-6': [
    makeDeliverable('phase-6', 'd6-1', 'Freight & Transportation', 'Coordinated transport of all fabricated elements from our facilities to the Portland venue, including specialized rigging for oversize pieces.', ['Climate-controlled freight (2 trucks)', 'Oversize load permitting', 'GPS tracking and ETAs', 'Insurance and liability coverage'], 18000, 'logistics'),
    makeDeliverable('phase-6', 'd6-2', 'Staging & Warehousing', 'Pre-event staging at our Portland facility for final assembly checks and load-in sequencing.', ['5-day staging at Portland facility', 'Assembly verification and QC', 'Load-in sequence documentation', 'Crew briefing and walk-through'], 8000, 'logistics'),
    makeDeliverable('phase-6', 'd6-3', 'Permitting & Compliance', 'All required permits, certificates, and compliance documentation for the public activation.', ['City event permits', 'Fire marshal inspection coordination', 'Certificate of insurance', 'ADA compliance verification'], 6000, 'logistics'),
  ],
  'phase-7': [
    makeDeliverable('phase-7', 'd7-1', 'Load-In & Installation', 'Three-day professional installation with a crew of 12, including structural assembly, electrical hookup, graphic installation, and technology commissioning.', ['12-person install crew (3 days)', 'Structural assembly and leveling', 'Electrical and lighting hookup', 'Graphic and signage installation'], 42000, 'installation'),
    makeDeliverable('phase-7', 'd7-2', 'Technology Commissioning', 'Full testing and calibration of all interactive experiences, lighting scenes, and AV systems.', ['Interactive pod testing and calibration', 'RFID system end-to-end verification', 'Lighting scene programming on-site', 'AV and sound system tuning'], 12000, 'technology'),
    makeDeliverable('phase-7', 'd7-3', 'Activation Support', 'On-site technical support team for the duration of the three-day activation, plus a dedicated production manager.', ['Technical director on-site (3 days)', 'Two technicians on-site (3 days)', 'Production manager (5 days total)', 'Real-time issue resolution'], 24000, 'support'),
  ],
  'phase-8': [
    makeDeliverable('phase-8', 'd8-1', 'Strike & De-Install', 'One-day professional strike with a crew of 10, including careful disassembly, packaging, and venue restoration.', ['10-person strike crew (1 day)', 'Careful disassembly and packaging', 'Venue restoration to original condition', 'Waste removal and recycling'], 14000, 'installation'),
    makeDeliverable('phase-8', 'd8-2', 'Post-Event Report', 'Comprehensive analysis of activation performance including attendance, engagement metrics, media coverage, and recommendations.', ['Attendance and dwell-time analytics', 'Interactive engagement metrics', 'Social media reach and sentiment', 'Recommendations for future activations'], 8000, 'strategy'),
  ],
};

// --- Add-ons ---

const addons: Record<string, PhaseAddon[]> = {
  'phase-2': [
    makeAddon('phase-2', 'ao-2-1', 'Architectural Animation', 'A cinematic 90-second fly-through animation for pre-event marketing and social media teasers.', 8500),
    makeAddon('phase-2', 'ao-2-2', 'VIP Lounge Design', 'Dedicated design package for an elevated VIP area with premium finishes and exclusive branding.', 12000),
  ],
  'phase-4': [
    makeAddon('phase-4', 'ao-4-1', 'Premium Finish Upgrade', 'Upgrade from powder coat to automotive-grade metallic finish on the centerpiece structure.', 18000, 'finish-tier'),
    makeAddon('phase-4', 'ao-4-2', 'Chrome Mirror Finish', 'Statement chrome mirror finish on the centerpiece for maximum visual impact.', 28000, 'finish-tier'),
    makeAddon('phase-4', 'ao-4-3', 'Scent Diffusion System', 'Ambient scent system integrated into the installation to trigger olfactory brand association.', 4500),
  ],
  'phase-5': [
    makeAddon('phase-5', 'ao-5-1', 'AI Personalization Engine', 'Machine learning layer that adapts interactive content based on individual guest behavior patterns.', 22000),
    makeAddon('phase-5', 'ao-5-2', 'Live Social Wall', 'Real-time social media aggregation wall displaying tagged posts, stories, and user-generated content.', 9500),
  ],
  'phase-7': [
    makeAddon('phase-7', 'ao-7-1', 'Extended Activation Support', 'Additional two days of on-site technical support for a five-day activation window.', 16000),
    makeAddon('phase-7', 'ao-7-2', 'Professional Photography', 'Dedicated event photographer capturing installation details, guest interactions, and atmosphere.', 6500),
    makeAddon('phase-7', 'ao-7-3', 'Drone Videography', 'Aerial drone footage of the full installation and surrounding context for post-event marketing.', 4500),
  ],
};

// --- Milestones ---

const milestones: Record<string, MilestoneGate & { requirements: MilestoneRequirement[] }> = {
  'phase-1': makeMilestone('phase-1', 'Discovery Approval', 'Proceeds to Design phase; triggers 25% deposit invoice.', [
    { text: 'Creative brief delivered and presented', assignee: 'producer' },
    { text: 'Site analysis report reviewed', assignee: 'client' },
    { text: 'Creative brief approved', assignee: 'client' },
  ]),
  'phase-2': makeMilestone('phase-2', 'Design Approval', 'Proceeds to Engineering; locks design scope for production.', [
    { text: '3D design package delivered', assignee: 'producer' },
    { text: 'Client review period (5 business days)', assignee: 'client' },
    { text: 'Design direction approved with sign-off', assignee: 'client' },
    { text: 'Revision round completed (if applicable)', assignee: 'both' },
  ]),
  'phase-3': makeMilestone('phase-3', 'Engineering Sign-Off', 'Proceeds to Fabrication; triggers material procurement.', [
    { text: 'PE-stamped structural drawings delivered', assignee: 'producer' },
    { text: 'Production drawings reviewed by client', assignee: 'client' },
    { text: 'Engineering package approved', assignee: 'client' },
  ]),
  'phase-4': makeMilestone('phase-4', 'Fabrication Complete', 'Proceeds to Logistics; all elements ready for transport.', [
    { text: 'All elements fabricated and QC passed', assignee: 'producer' },
    { text: 'Client factory visit or video walkthrough', assignee: 'both' },
    { text: 'Fabrication quality approved', assignee: 'client' },
  ]),
  'phase-6': makeMilestone('phase-6', 'Logistics Clearance', 'Proceeds to Installation; all permits and transport confirmed.', [
    { text: 'All permits secured', assignee: 'producer' },
    { text: 'Transport schedule confirmed', assignee: 'producer' },
    { text: 'Insurance certificates delivered', assignee: 'producer' },
    { text: 'Logistics plan acknowledged', assignee: 'client' },
  ]),
  'phase-7': makeMilestone('phase-7', 'Activation Go-Live', 'Experience opens to public; triggers balance invoice.', [
    { text: 'Installation complete and inspected', assignee: 'producer' },
    { text: 'Technology systems tested and calibrated', assignee: 'producer' },
    { text: 'Client walkthrough completed', assignee: 'both' },
    { text: 'Go-live approved', assignee: 'client' },
  ]),
};

// --- Creative references ---

const creativeRefs: Record<string, CreativeReference[]> = {
  'phase-1': [
    makeRef('phase-1', 'cr-1-1', 'Air Max 1 Heritage', 'reference', 'The original 1987 silhouette and its cultural impact'),
    makeRef('phase-1', 'cr-1-2', 'Portland Street Culture', 'mood', 'Local creative energy and community spirit'),
    makeRef('phase-1', 'cr-1-3', 'Nike Innovation Lab', 'inspiration', 'Material innovation and future-forward thinking'),
  ],
  'phase-2': [
    makeRef('phase-2', 'cr-2-1', 'Kinetic Light Sculptures', 'inspiration', 'Dynamic light and form precedents'),
    makeRef('phase-2', 'cr-2-2', 'Air Max Palette', 'palette', 'Infrared, white, grey, and black — the signature colors'),
    makeRef('phase-2', 'cr-2-3', 'Immersive Retail', 'experience', 'Best-in-class experiential retail references'),
    makeRef('phase-2', 'cr-2-4', 'Material Textures', 'material', 'Mesh, foam, rubber — translating shoe materials to architectural scale'),
  ],
};

// --- Payment terms ---

const paymentTerms: PaymentTerms = {
  structure: '50/50',
  depositPercent: 50,
  balancePercent: 50,
};

// ---------------------------------------------------------------------------

function buildPhaseData() {
  return phases.map((phase) => ({
    phase,
    deliverables: deliverables[phase.id] || [],
    addons: addons[phase.id] || [],
    milestone: milestones[phase.id] || null,
    creativeReferences: creativeRefs[phase.id] || [],
  }));
}

export default async function ProposalJourneyPage({ params }: PageProps) {
  const { orgSlug, id } = await params;

  const phaseData = buildPhaseData();

  return (
    <JourneyContent
      proposalName="Nike Air Max Day Experience"
      proposalSubtitle="A multi-sensory activation celebrating 39 years of visible air, transforming Pioneer Courthouse Square into an immersive journey through innovation, culture, and craft."
      phases={phaseData}
      paymentTerms={paymentTerms}
      currency="USD"
      currentPhaseId="phase-3"
    />
  );
}
