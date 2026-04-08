/**
 * Proposal Document Template
 *
 * White-labeled experiential production proposal matching the 8-phase
 * milestone model. All branding pulled from the organization record.
 */

import {
  Paragraph,
  TextRun,
  AlignmentType,
  ImageRun,
} from 'docx';

import type {
  Organization,
  Proposal,
  Client,
  ClientContact,
  User,
  Phase,
  PhaseDeliverable,
  PhaseAddon,
  MilestoneGate,
  MilestoneRequirement,
  CreativeReference,
  PhasePortfolioLink,
  Venue,
  TermsDocument,
} from '@/types/database';

import {
  castPaymentTerms,
  castJson,
  castNarrativeContext,
} from '../json-casts';

import {
  brandFromOrg,
  heading,
  body,
  bullet,
  checkbox,
  calloutBox,
  dataTable,
  kvTable,
  signatureBlock,
  formatCurrency,
  formatDate,
  buildSection,
  createDocument,
  packDocument,
  spacer,
  pageBreak,
  phaseHeaderBlock,
  narrativeBlock,
  styledBox,
  milestoneGateBox,
  addOnTable,
  referenceCards,
  type DocBrand,
  type TableColumn,
} from '../engine';

import {
  castDocAddress,
  castActivationDates,
  castLoadInStrikeEntry,
} from '../doc-types';

// ---------------------------------------------------------------------------
// Public data interface
// ---------------------------------------------------------------------------

export interface ProposalDocumentData {
  org: Organization;
  proposal: Proposal;
  client: Client;
  clientContact: ClientContact | null;
  preparedBy: User | null;
  phases: Phase[];
  phaseData: Map<
    string,
    {
      deliverables: PhaseDeliverable[];
      addons: PhaseAddon[];
      milestone: MilestoneGate | null;
      requirements: MilestoneRequirement[];
      creativeRefs: CreativeReference[];
      portfolioLinks: PhasePortfolioLink[];
    }
  >;
  venues: Venue[];
  termsDocument: TermsDocument | null;
  logoBuffer?: Buffer;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function coverPage(brand: DocBrand, data: ProposalDocumentData): (Paragraph)[] {
  const { proposal, client } = data;
  const children: Paragraph[] = [];

  // Top spacer
  children.push(spacer(2400));

  // Logo
  if (brand.logoBuffer && brand.logoMime) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new ImageRun({
            type: brand.logoMime,
            data: brand.logoBuffer,
            transformation: { width: 200, height: 75 },
            altText: {
              title: brand.orgName,
              description: `${brand.orgName} logo`,
              name: 'cover-logo',
            },
          }),
        ],
      })
    );
    children.push(spacer(200));
  }

  // Org name
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [
        new TextRun({
          text: brand.orgName.toUpperCase(),
          bold: true,
          font: brand.fontHeading,
          size: 48,
          color: brand.primaryColor,
        }),
      ],
    })
  );

  // Tagline
  if (brand.tagline) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
        children: [
          new TextRun({
            text: brand.tagline,
            italics: true,
            font: brand.fontBody,
            size: 24,
            color: brand.secondaryColor,
          }),
        ],
      })
    );
  }

  // Divider spacer
  children.push(spacer(400));

  // Client x Org
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: `${client.company_name}  \u00D7  ${brand.orgName}`,
          bold: true,
          font: brand.fontHeading,
          size: 32,
          color: brand.primaryColor,
        }),
      ],
    })
  );

  // Project name
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [
        new TextRun({
          text: proposal.name,
          bold: true,
          font: brand.fontHeading,
          size: 36,
          color: brand.primaryColor,
        }),
      ],
    })
  );

  // Subtitle / activation type
  if (proposal.subtitle) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: proposal.subtitle,
            font: brand.fontBody,
            size: 24,
            color: brand.secondaryColor,
          }),
        ],
      })
    );
  }

  // Version
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
      children: [
        new TextRun({
          text: `Version ${proposal.version}`,
          font: brand.fontBody,
          size: 20,
          color: '71717A',
        }),
      ],
    })
  );

  // Prepared for / by block
  const contactName = data.clientContact
    ? `${data.clientContact.first_name} ${data.clientContact.last_name}`
    : null;

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
      children: [
        new TextRun({ text: 'Prepared for: ', bold: true, size: 20, color: brand.secondaryColor }),
        new TextRun({ text: contactName ? `${contactName}, ${client.company_name}` : client.company_name, size: 20 }),
      ],
    })
  );

  if (data.preparedBy) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 40 },
        children: [
          new TextRun({ text: 'Prepared by: ', bold: true, size: 20, color: brand.secondaryColor }),
          new TextRun({
            text: data.preparedBy.title
              ? `${data.preparedBy.full_name}, ${data.preparedBy.title}`
              : data.preparedBy.full_name,
            size: 20,
          }),
        ],
      })
    );
  }

  // Date
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
      children: [
        new TextRun({ text: 'Date: ', bold: true, size: 20, color: brand.secondaryColor }),
        new TextRun({ text: formatDate(proposal.prepared_date ?? proposal.created_at), size: 20 }),
      ],
    })
  );

  // Valid until
  if (proposal.valid_until) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 40 },
        children: [
          new TextRun({ text: 'Valid until: ', bold: true, size: 20, color: brand.secondaryColor }),
          new TextRun({ text: formatDate(proposal.valid_until), size: 20 }),
        ],
      })
    );
  }

  // Confidential notice
  children.push(spacer(600));
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'CONFIDENTIAL & PROPRIETARY',
          bold: true,
          font: brand.fontHeading,
          size: 18,
          color: brand.accentColor,
        }),
      ],
    })
  );

  return children;
}

function introductionSection(brand: DocBrand, data: ProposalDocumentData): (Paragraph | ReturnType<typeof dataTable>)[] {
  const narr = castNarrativeContext(data.proposal.narrative_context);
  const assumptions = (narr?.assumptions as string[] | undefined) ?? [];
  const children: (Paragraph | ReturnType<typeof dataTable>)[] = [];

  children.push(...[
    heading('Your Activation Journey', 1),
    body(
      'This proposal is organized around a proven phase-milestone model designed for experiential production. ' +
        'Each phase represents a distinct stage of the project lifecycle \u2014 from creative strategy through ' +
        'fabrication, logistics, activation, and wrap. Every phase concludes with a Milestone Gate: a clear ' +
        'checklist of deliverables, approvals, and requirements that must be satisfied before advancing to the ' +
        'next stage.'
    ),
    spacer(100),
    body(
      'This structure ensures full transparency, prevents scope creep, and keeps all stakeholders aligned ' +
        'on timelines, budgets, and expectations. The investment for each phase is clearly outlined, and ' +
        'optional add-ons are presented separately so you can tailor the scope to your objectives.'
    ),
    spacer(100),
    body(
      'Review each phase carefully. Your dedicated project team is available to walk through every detail ' +
        'and customize this proposal to fit your vision.',
      { italic: true, color: brand.secondaryColor }
    ),
  ]);

  // Assumptions section
  if (assumptions.length > 0) {
    children.push(spacer(200));
    children.push(...styledBox(
      'Key Assumptions',
      assumptions.map((a, i) => `${i + 1}. ${a}`),
      'info',
      brand,
    ));
  }

  return children;
}

function creativeRefLabel(type: string): string {
  const map: Record<string, string> = {
    campaign: 'Campaign Reference',
    mood: 'Mood Board',
    palette: 'Color Palette',
    experience: 'Experience Reference',
    reference: 'Reference',
    material: 'Material Reference',
    competitor: 'Competitor Reference',
    inspiration: 'Inspiration',
  };
  return map[type] ?? 'Reference';
}

function phaseSection(
  brand: DocBrand,
  phase: Phase,
  data: {
    deliverables: PhaseDeliverable[];
    addons: PhaseAddon[];
    milestone: MilestoneGate | null;
    requirements: MilestoneRequirement[];
    creativeRefs: CreativeReference[];
    portfolioLinks: PhasePortfolioLink[];
  },
  currency: string
): (Paragraph | ReturnType<typeof dataTable>)[] {
  const children: (Paragraph | ReturnType<typeof dataTable>)[] = [];

  // Phase heading — styled block with number label + title + rule + subtitle
  children.push(...phaseHeaderBlock(phase.phase_number, phase.name, phase.subtitle, brand));

  // Narrative — styled left-border block
  if (phase.narrative) {
    children.push(narrativeBlock(phase.narrative, brand));
  }

  // Creative references — 2-column reference cards
  if (data.creativeRefs.length > 0) {
    children.push(spacer(200));
    children.push(
      ...referenceCards(
        data.creativeRefs.map((ref) => ({
          label: ref.label,
          description: ref.description ?? '',
          type: creativeRefLabel(ref.type),
        })),
        'Creative Direction & Reference Imagery',
        brand,
      ),
    );
  }

  // Portfolio / precedent work — 2-column reference cards
  if (data.portfolioLinks.length > 0) {
    children.push(spacer(200));
    children.push(
      ...referenceCards(
        data.portfolioLinks.map((link) => ({
          label: link.context_description ?? `Portfolio #${link.portfolio_item_id.slice(0, 8)}`,
          description: link.context_description ?? '',
        })),
        'Portfolio & Precedent Work',
        brand,
        'D97706', // amber
      ),
    );
  }

  // Core deliverables table
  if (data.deliverables.length > 0) {
    children.push(spacer(200));
    children.push(heading('Core Deliverables', 2));

    const cols: TableColumn[] = [
      { header: 'Deliverable', width: 2200 },
      { header: 'Description', width: 2400 },
      { header: 'Details', width: 2000 },
      { header: 'Qty', width: 600, align: AlignmentType.CENTER },
      { header: 'Unit Cost', width: 1000, align: AlignmentType.RIGHT },
      { header: 'Total', width: 1160, align: AlignmentType.RIGHT },
    ];

    const rows = data.deliverables
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((d) => [
        d.name,
        d.description ?? '',
        castJson<string[]>(d.details as import('@/types/database').Json, []).join('; '),
        String(d.qty),
        formatCurrency(d.unit_cost ?? 0, currency),
        formatCurrency(d.total_cost ?? 0, currency),
      ]);

    children.push(dataTable(cols, rows, brand));
  }

  // Add-ons — styled amber table with checkboxes
  if (data.addons.length > 0) {
    children.push(spacer(200));
    children.push(heading('Options & Add-Ons', 2));
    children.push(
      addOnTable(
        data.addons.sort((a, b) => a.sort_order - b.sort_order).map((addon) => ({
          name: addon.name,
          description: addon.description ?? '',
          cost: formatCurrency(addon.total_cost ?? 0, currency),
          selected: addon.is_selected ?? false,
          // terms_ref is resolved from terms_sections if applicable
        })),
        brand,
      ),
    );
  }

  // Phase investment subtotal
  children.push(spacer(200));
  children.push(
    new Paragraph({
      spacing: { before: 120, after: 120 },
      alignment: AlignmentType.RIGHT,
      children: [
        new TextRun({
          text: 'Phase Investment: ',
          bold: true,
          size: 24,
          color: brand.secondaryColor,
          font: brand.fontHeading,
        }),
        new TextRun({
          text: formatCurrency(phase.phase_investment ?? 0, currency),
          bold: true,
          size: 24,
          color: brand.primaryColor,
          font: brand.fontHeading,
        }),
      ],
    })
  );

  // Contractual framework — styled purple box
  const termsSections = castJson<string[]>(phase.terms_sections as import('@/types/database').Json, []);
  if (termsSections.length > 0) {
    const refs = termsSections.map((s) => `\u00A7${s}`).join(', ');
    children.push(spacer(120));
    children.push(
      ...styledBox(
        'Contractual Framework',
        [`Governing sections: ${refs}`],
        'terms',
        brand,
      ),
    );
  }

  // Milestone gate — styled green box with checkbox requirements
  if (data.milestone) {
    children.push(spacer(200));
    children.push(
      ...milestoneGateBox(
        data.milestone.name,
        data.requirements
          .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
          .map((req) => ({
            text: req.text,
            assignee: req.assignee,
          })),
        data.milestone.unlocks_description ?? null,
        brand,
      ),
    );
  }

  return children;
}

function investmentSummary(
  brand: DocBrand,
  phases: Phase[],
  phaseData: ProposalDocumentData['phaseData'],
  proposal: Proposal
): (Paragraph | ReturnType<typeof dataTable>)[] {
  const children: (Paragraph | ReturnType<typeof dataTable>)[] = [];
  const currency = proposal.currency;

  children.push(heading('Investment Summary', 1));

  // Phase-by-phase table
  const cols: TableColumn[] = [
    { header: 'Phase', width: 1200 },
    { header: 'Name', width: 4800 },
    { header: 'Investment', width: 3360, align: AlignmentType.RIGHT },
  ];

  const rows = phases.map((p) => [
    `Phase ${p.phase_number}`,
    p.name,
    formatCurrency(p.phase_investment ?? 0, currency),
  ]);

  children.push(dataTable(cols, rows, brand));
  children.push(spacer(200));

  // Totals
  const addonsTotal = (proposal.total_with_addons ?? 0) - (proposal.total_value ?? 0);

  const totalPairs: [string, string][] = [
    ['Core Scope Total', formatCurrency(proposal.total_value ?? 0, currency)],
  ];

  if (addonsTotal > 0) {
    totalPairs.push(['Selected Add-Ons Total', formatCurrency(addonsTotal, currency)]);
  }

  totalPairs.push(['Grand Total', formatCurrency(proposal.total_with_addons ?? 0, currency)]);

  children.push(kvTable(totalPairs, brand));

  return children;
}

function paymentTermsSection(
  brand: DocBrand,
  proposal: Proposal
): Paragraph[] {
  const children: Paragraph[] = [];
  const pt = castPaymentTerms(proposal.payment_terms as import('@/types/database').Json);

  children.push(heading('Payment Terms', 1));

  if (!pt) {
    children.push(body('Payment terms to be defined upon contract execution.'));
    return children;
  }

  children.push(bullet(`Deposit: ${pt.depositPercent}% of total project investment, due upon contract execution.`));
  children.push(bullet(`Balance: ${pt.balancePercent}% due per the milestone schedule outlined above.`));

  if (pt.structure) {
    children.push(spacer(80));
    children.push(body(`Payment Structure: ${pt.structure}`, { italic: true, color: brand.secondaryColor }));
  }

  if (pt.lateFeeRate) {
    children.push(bullet(`Late payments subject to a ${pt.lateFeeRate}% monthly fee.`));
  }

  if (pt.creditCardSurcharge) {
    children.push(bullet(`Credit card payments subject to a ${pt.creditCardSurcharge}% processing surcharge.`));
  }

  return children;
}

function assumptionsSection(
  brand: DocBrand,
  assumptions: string[]
): Paragraph[] {
  if (assumptions.length === 0) return [];

  const children: Paragraph[] = [];
  children.push(heading('Assumptions & Notes', 1));

  for (const note of assumptions) {
    children.push(bullet(note));
  }

  return children;
}

function venueScheduleSection(
  brand: DocBrand,
  venues: Venue[]
): (Paragraph | ReturnType<typeof dataTable>)[] {
  if (venues.length === 0) return [];

  const children: (Paragraph | ReturnType<typeof dataTable>)[] = [];
  children.push(heading('Venue Schedule', 1));

  const cols: TableColumn[] = [
    { header: 'Venue', width: 2000 },
    { header: 'Address', width: 2500 },
    { header: 'Activation Dates', width: 1800 },
    { header: 'Load-In', width: 1530 },
    { header: 'Strike', width: 1530 },
  ];

  const rows = venues
    .sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0))
    .map((v) => {
      const addr = castDocAddress(v.address);
      const addrStr = addr ? [addr.street, addr.city, addr.state, addr.zip].filter(Boolean).join(', ') : '';

      const ad = castActivationDates(v.activation_dates);
      const activationStr = ad
        ? `${formatDate(ad.start)} \u2013 ${formatDate(ad.end)}`
        : '\u2014';

      const li = castLoadInStrikeEntry(v.load_in);
      const loadInStr = li
        ? `${formatDate(li.date)} ${li.startTime}\u2013${li.endTime}`
        : '\u2014';

      const st = castLoadInStrikeEntry(v.strike);
      const strikeStr = st
        ? `${formatDate(st.date)} ${st.startTime}\u2013${st.endTime}`
        : '\u2014';

      return [v.name, addrStr, activationStr, loadInStr, strikeStr];
    });

  children.push(dataTable(cols, rows, brand));

  return children;
}

// ---------------------------------------------------------------------------
// Main generator
// ---------------------------------------------------------------------------

export async function generateProposalDocument(
  data: ProposalDocumentData
): Promise<Buffer> {
  const brand = brandFromOrg(data.org, data.logoBuffer);
  const sortedPhases = [...data.phases].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  // --- Section 1: Cover page (no header/footer) ---
  const coverSection = buildSection({
    brand,
    children: coverPage(brand, data),
    includeHeaderFooter: false,
  });

  // --- Section 2: Introduction ---
  const introChildren: (Paragraph | ReturnType<typeof dataTable>)[] = [
    ...introductionSection(brand, data),
  ];

  const introSection = buildSection({
    brand,
    children: introChildren,
    documentTitle: data.proposal.name,
  });

  // --- Section 3+: Per-phase sections ---
  const phaseSections = sortedPhases.map((phase) => {
    const pd = data.phaseData.get(phase.id) ?? {
      deliverables: [],
      addons: [],
      milestone: null,
      requirements: [],
      creativeRefs: [],
      portfolioLinks: [],
    };

    return buildSection({
      brand,
      children: phaseSection(brand, phase, pd, data.proposal.currency),
      documentTitle: data.proposal.name,
    });
  });

  // --- Investment summary section ---
  const investmentChildren: (Paragraph | ReturnType<typeof dataTable>)[] = [
    ...investmentSummary(brand, sortedPhases, data.phaseData, data.proposal),
  ];

  const investmentSection = buildSection({
    brand,
    children: investmentChildren,
    documentTitle: data.proposal.name,
  });

  // --- Payment terms section ---
  const paymentChildren: (Paragraph | ReturnType<typeof dataTable>)[] = [
    ...paymentTermsSection(brand, data.proposal),
  ];

  // --- Assumptions section ---
  const proposalNarr = castNarrativeContext(data.proposal.narrative_context);
  const rawAssumptions = proposalNarr?.assumptions;
  const assumptionParas = assumptionsSection(brand, Array.isArray(rawAssumptions) ? rawAssumptions as string[] : []);
  if (assumptionParas.length > 0) {
    paymentChildren.push(pageBreak(), ...assumptionParas);
  }

  const paymentSection = buildSection({
    brand,
    children: paymentChildren,
    documentTitle: data.proposal.name,
  });

  // --- Venue schedule section (optional) ---
  const venueSections: ReturnType<typeof buildSection>[] = [];
  if (data.venues.length > 0) {
    venueSections.push(
      buildSection({
        brand,
        children: venueScheduleSection(brand, data.venues),
        documentTitle: data.proposal.name,
      })
    );
  }

  // --- Signature block ---
  const sigSection = buildSection({
    brand,
    children: signatureBlock(brand, data.client.company_name),
    documentTitle: data.proposal.name,
  });

  // --- Assemble ---
  const doc = createDocument(brand, [
    coverSection,
    introSection,
    ...phaseSections,
    investmentSection,
    paymentSection,
    ...venueSections,
    sigSection,
  ]);

  return packDocument(doc);
}
