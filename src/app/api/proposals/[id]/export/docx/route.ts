import { NextResponse } from 'next/server';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { createClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/api/permission-guard';
import { getSeedProposals, getSeedClients, getSeedPhases } from '@/lib/seed-data';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const permError = await requirePermission('proposals', 'view');
  if (permError) return permError;

  const { id } = await params;

  let proposalName = 'Proposal';
  let clientName = 'Client';
  let subtitle = '';
  let totalValue = 0;
  let phases: Array<{ name: string; phase_investment: number }> = [];

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error('No auth');

    const { data: proposal } = await supabase
      .from('proposals')
      .select('*, clients(company_name)')
      .eq('id', id)
      .single();

    if (!proposal) throw new Error('Not found');

    proposalName = proposal.name;
    clientName = (proposal.clients as Record<string, string>)?.company_name ?? 'Client';
    subtitle = proposal.subtitle ?? '';
    totalValue = proposal.total_value;

    const { data: phaseData } = await supabase
      .from('phases')
      .select('name, phase_investment')
      .eq('proposal_id', id)
      .order('sort_order');

    phases = (phaseData ?? []) as Array<{ name: string; phase_investment: number }>;
  } catch {
    // Fallback to seed data
    const proposals = getSeedProposals();
    const clients = getSeedClients();
    const proposal = proposals.find((p) => p.id === id) ?? proposals[0];
    const client = clients.find((c) => c.id === proposal.client_id);

    proposalName = proposal.name;
    clientName = client?.company_name ?? 'Client';
    subtitle = proposal.subtitle ?? '';
    totalValue = proposal.total_value;
    phases = getSeedPhases(proposal.id).map((p) => ({
      name: p.name,
      phase_investment: p.phase_investment,
    }));
  }

  const currencyFmt = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            text: proposalName,
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 200 },
          }),
          ...(subtitle
            ? [
                new Paragraph({
                  text: subtitle,
                  heading: HeadingLevel.HEADING_2,
                  spacing: { after: 300 },
                }),
              ]
            : []),
          new Paragraph({
            children: [
              new TextRun({ text: 'Prepared for: ', bold: true }),
              new TextRun({ text: clientName }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Total Investment: ', bold: true }),
              new TextRun({ text: currencyFmt.format(totalValue) }),
            ],
            spacing: { after: 400 },
          }),
          new Paragraph({
            text: 'Project Phases',
            heading: HeadingLevel.HEADING_2,
            spacing: { after: 200 },
          }),
          ...phases.map(
            (phase) =>
              new Paragraph({
                children: [
                  new TextRun({ text: phase.name, bold: true }),
                  new TextRun({
                    text: `  —  ${currencyFmt.format(phase.phase_investment)}`,
                  }),
                ],
                spacing: { after: 100 },
              })
          ),
          new Paragraph({
            spacing: { before: 300 },
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({
                text: `Total: ${currencyFmt.format(totalValue)}`,
                bold: true,
                size: 28,
              }),
            ],
          }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const filename = `${proposalName.replace(/[^a-zA-Z0-9]/g, '_')}.docx`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
