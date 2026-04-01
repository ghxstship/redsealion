import { NextResponse } from 'next/server';

type ExportType = 'crm' | 'finance' | 'pm' | 'assets';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; type: string }> }
) {
  const { id, type } = await params;

  const validTypes: ExportType[] = ['crm', 'finance', 'pm', 'assets'];

  if (!validTypes.includes(type as ExportType)) {
    return NextResponse.json(
      { success: false, error: `Invalid export type. Valid types: ${validTypes.join(', ')}` },
      { status: 400 }
    );
  }

  // Placeholder payloads — will be populated from Supabase data
  const payloads: Record<ExportType, Record<string, unknown>> = {
    crm: {
      proposal_id: id,
      export_type: 'crm',
      client: {
        company_name: 'Nike, Inc.',
        contact_name: 'Sarah Mitchell',
        email: 'sarah.mitchell@nike.com',
      },
      deal: {
        name: 'Nike Air Max Day Experience',
        value: 510000,
        status: 'in_production',
        probability: 100,
      },
    },
    finance: {
      proposal_id: id,
      export_type: 'finance',
      total_value: 510000,
      currency: 'USD',
      invoices: [
        { number: 'INV-2026-001', amount: 127500, status: 'paid' },
        { number: 'INV-2026-002', amount: 127500, status: 'sent' },
        { number: 'INV-2026-003', amount: 255000, status: 'draft' },
      ],
      payment_terms: { structure: '50/50', deposit_percent: 50, balance_percent: 50 },
    },
    pm: {
      proposal_id: id,
      export_type: 'pm',
      project_name: 'Nike Air Max Day Experience',
      phases: [
        { number: '1', name: 'Discovery', status: 'complete', tasks: 3 },
        { number: '2', name: 'Design', status: 'complete', tasks: 3 },
        { number: '3', name: 'Engineering', status: 'in_progress', tasks: 3 },
        { number: '4', name: 'Fabrication', status: 'not_started', tasks: 4 },
        { number: '5', name: 'Technology', status: 'not_started', tasks: 3 },
        { number: '6', name: 'Logistics', status: 'not_started', tasks: 3 },
        { number: '7', name: 'Installation & Activation', status: 'not_started', tasks: 3 },
        { number: '8', name: 'Strike & Close', status: 'not_started', tasks: 2 },
      ],
    },
    assets: {
      proposal_id: id,
      export_type: 'assets',
      assets: [
        { name: 'Air Max Sole Centerpiece', type: 'structure', category: 'fabrication', reusable: true },
        { name: 'Interactive Pod A', type: 'fixture', category: 'fabrication', reusable: true },
        { name: 'Interactive Pod B', type: 'fixture', category: 'fabrication', reusable: true },
        { name: 'LED Strip Assembly Set', type: 'lighting', category: 'fabrication', reusable: true },
        { name: 'Tension Fabric Graphics', type: 'graphic', category: 'fabrication', reusable: false },
      ],
    },
  };

  return NextResponse.json({
    success: true,
    exported_at: new Date().toISOString(),
    data: payloads[type as ExportType],
  });
}
