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
  PageBreak,
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
  labelValue,
  CONTENT_WIDTH,
  type DocBrand,
  type TableColumn,
} from '../engine';

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

function introductionSection(brand: DocBrand): Paragraph[] {
  return [
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
  ];
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

  // Phase heading
  children.push(
    new Paragraph({
      spacing: { before: 360, after: 80 },
      children: [
        new TextRun({
          text: `PHASE ${phase.phase_number}`,
          bold: true,
          font: brand.fontHeading,
          size: 20,
          color: brand.accentColor,
        }),
      ],
    })
  );
  children.push(heading(phase.name, 1));

  if (phase.subtitle) {
    children.push(
      body(phase.subtitle, { italic: true, color: brand.secondaryColor, size: 24 })
    );
  }

  // Narrative
  if (phase.narrative) {
    children.push(spacer(100));
    children.push(body(phase.narrative));
  }

  // Creative references
  if (data.creativeRefs.length > 0) {
    children.push(spacer(200));
    children.push(heading('Creative Reference Imagery', 3));
    for (const ref of data.creativeRefs) {
      const typeLabel = creativeRefLabel(ref.type);
      children.push(
        bullet(`${typeLabel}: ${ref.label}${ref.description ? ' \u2014 ' + ref.description : ''}`)
      );
    }
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
        d.details.join('; '),
        String(d.qty),
        formatCurrency(d.unit_cost, currency),
        formatCurrency(d.total_cost, currency),
      ]);

    children.push(dataTable(cols, rows, brand));
  }

  // Add-ons
  if (data.addons.length > 0) {
    children.push(spacer(200));
    children.push(heading('Options & Add-Ons', 2));

    for (const addon of data.addons.sort((a, b) => a.sort_order - b.sort_order)) {
      children.push(
        checkbox(
          `${addon.name}${addon.description ? ' \u2014 ' + addon.description : ''} \u2014 ${formatCurrency(addon.total_cost, currency)}`,
          addon.is_selected
        )
      );
    }
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
          text: formatCurrency(phase.phase_investment, currency),
          bold: true,
          size: 24,
          color: brand.primaryColor,
          font: brand.fontHeading,
        }),
      ],
    })
  );

  // Contractual framework callout
  if (phase.terms_sections.length > 0) {
    const refs = phase.terms_sections.map((s) => `\u00A7${s}`).join(', ');
    children.push(
      calloutBox(`Contractual Framework: ${refs}`, brand, '\u00A7')
    );
  }

  // Milestone gate
  if (data.milestone) {
    children.push(spacer(200));
    children.push(heading(`Milestone Gate: ${data.milestone.name}`, 3));

    if (data.requirements.length > 0) {
      for (const req of data.requirements.sort((a, b) => a.sort_order - b.sort_order)) {
        const assigneeLabel = req.assignee === 'client' ? ' [Client]' : req.assignee === 'producer' ? ' [Producer]' : req.assignee === 'both' ? ' [Both]' : ' [Vendor]';
        children.push(checkbox(`${req.text}${assigneeLabel}`, req.status === 'complete'));
      }
    }

    if (data.milestone.unlocks_description) {
      children.push(spacer(80));
      children.push(
        calloutBox(`Unlocks: ${data.milestone.unlocks_description}`, brand, '\u2192')
      );
    }
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
    formatCurrency(p.phase_investment, currency),
  ]);

  children.push(dataTable(cols, rows, brand));
  children.push(spacer(200));

  // Totals
  const addonsTotal = proposal.total_with_addons - proposal.total_value;

  const totalPairs: [string, string][] = [
    ['Core Scope Total', formatCurrency(proposal.total_value, currency)],
  ];

  if (addonsTotal > 0) {
    totalPairs.push(['Selected Add-Ons Total', formatCurrency(addonsTotal, currency)]);
  }

  totalPairs.push(['Grand Total', formatCurrency(proposal.total_with_addons, currency)]);

  children.push(kvTable(totalPairs, brand));

  return children;
}

function paymentTermsSection(
  brand: DocBrand,
  proposal: Proposal
): Paragraph[] {
  const children: Paragraph[] = [];
  const pt = proposal.payment_terms;

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
    .sort((a, b) => a.sequence - b.sequence)
    .map((v) => {
      const addr = v.address;
      const addrStr = [addr.street, addr.city, addr.state, addr.zip].filter(Boolean).join(', ');

      const activationStr = v.activation_dates
        ? `${formatDate(v.activation_dates.start)} \u2013 ${formatDate(v.activation_dates.end)}`
        : '\u2014';

      const loadInStr = v.load_in
        ? `${formatDate(v.load_in.date)} ${v.load_in.startTime}\u2013${v.load_in.endTime}`
        : '\u2014';

      const strikeStr = v.strike
        ? `${formatDate(v.strike.date)} ${v.strike.startTime}\u2013${v.strike.endTime}`
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
  const sortedPhases = [...data.phases].sort((a, b) => a.sort_order - b.sort_order);

  // --- Section 1: Cover page (no header/footer) ---
  const coverSection = buildSection({
    brand,
    children: coverPage(brand, data),
    includeHeaderFooter: false,
  });

  // --- Section 2: Introduction ---
  const introChildren: (Paragraph | ReturnType<typeof dataTable>)[] = [
    ...introductionSection(brand),
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
  const assumptionParas = assumptionsSection(brand, data.proposal.assumptions);
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
