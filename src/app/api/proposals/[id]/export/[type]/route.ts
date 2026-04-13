import { NextResponse } from 'next/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { createClient } from '@/lib/supabase/server';

type ExportType = 'crm' | 'finance' | 'pm' | 'assets';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; type: string }> }
) {
  const perm = await checkPermission('integrations', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id, type } = await params;

  const validTypes: ExportType[] = ['crm', 'finance', 'pm', 'assets'];

  if (!validTypes.includes(type as ExportType)) {
    return NextResponse.json(
      { success: false, error: `Invalid export type. Valid types: ${validTypes.join(', ')}` },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  // Basic Proposal fetch (used in all exports)
  const { data: proposal, error: propError } = await supabase
    .from('proposals')
    .select('*, clients(*)')
    .eq('organization_id', perm!.organizationId)
    .eq('id', id)
    .single();

  if (propError || !proposal) {
    return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
  }

  const client = (proposal.clients as Record<string, unknown>) ?? {};

  let outputData: Record<string, unknown> = {};

  if (type === 'crm') {
    const { data: deals } = await supabase
      .from('deals')
      .select('*')
    .eq('organization_id', perm!.organizationId)
      .eq('proposal_id', id)
      .limit(1);
    
    const deal = deals?.[0] || null;

    outputData = {
      proposal_id: proposal.id,
      export_type: 'crm',
      client: {
        id: client.id,
        company_name: client.company_name,
        industry: client.industry,
      },
      deal: deal ? {
        id: deal.id,
        title: deal.title,
        value: deal.deal_value || proposal.total_value,
        status: deal.stage,
      } : null,
      proposal_status: proposal.status,
    };
  } else if (type === 'finance') {
    const { data: invoices } = await supabase
      .from('invoices')
      .select('id, number, amount, status')
    .eq('organization_id', perm!.organizationId)
      .eq('proposal_id', id);

    outputData = {
      proposal_id: proposal.id,
      export_type: 'finance',
      total_value: proposal.total_value,
      currency: 'USD',
      client_company: client.company_name,
      client_billing_address: client.billing_address,
      invoices: invoices ?? [],
    };
  } else if (type === 'pm') {
    const { data: phases } = await supabase
      .from('phases')
      .select('*, phase_deliverables(id)')
      .eq('organization_id', perm!.organizationId)
      .eq('proposal_id', id)
      .order('sort_order', { ascending: true });

    outputData = {
      proposal_id: proposal.id,
      export_type: 'pm',
      project_name: proposal.name,
      start_date: proposal.event_dates,
      phases: (phases ?? []).map((ph) => ({
        id: ph.id,
        number: ph.number,
        name: ph.name,
        description: ph.narrative,
        duration_days: ph.duration_days,
        tasks_count: ph.phase_deliverables?.length ?? 0
      }))
    };
  } else if (type === 'assets') {
    const { data: phases } = await supabase
      .from('phases')
      .select('phase_deliverables(*)')
      .eq('organization_id', perm!.organizationId)
      .eq('proposal_id', id);

    const deliverables = (phases ?? [])
      .map((p) => p.phase_deliverables ?? [])
      .flat() as Record<string, unknown>[];

    outputData = {
      proposal_id: proposal.id,
      export_type: 'assets',
      assets: deliverables.map((d) => ({
        id: d.id,
        name: d.name,
        category: d.category,
        description: d.description,
        is_reusable: false, // Defaulting as phase deliverables are typically bespoke
      }))
    };
  }

  return NextResponse.json({
    success: true,
    exported_at: new Date().toISOString(),
    data: outputData,
  });
}
