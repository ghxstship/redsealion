import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { createLogger } from '@/lib/logger';

const log = createLogger('proposals:convert');

type ProposalDeliverable = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
};

type ProposalAddon = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  selected: boolean;
};

type ProposalPhase = {
  name: string;
  phase_deliverables: ProposalDeliverable[];
  phase_addons?: ProposalAddon[];
};

type ProposalChecklistItem = {
  id: string;
  title: string;
  description_text: string | null;
  completed: boolean;
  category: string | null;
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    const { id: proposalId } = await params;

    if (!ctx) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Fetch proposal and its related phases and deliverables
    const { data: proposal, error: proposalError } = await supabase
      .from('proposals')
      .select(`
        *,
        clients ( id, company_name ),
        phases (
          id,
          name,
          phase_deliverables (
            id, name, description, unit, qty, category
          ),
          phase_addons (
            id, name, description, unit, qty, category, selected
          )
        )
      `)
      .eq('id', proposalId)
      .eq('organization_id', ctx.organizationId)
      .single();

    if (proposalError || !proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }

    if (proposal.status !== 'approved') {
      return NextResponse.json({ error: 'Proposal must be approved before conversion' }, { status: 400 });
    }

    // 2. We can create one work order for the entire proposal, or one per phase.
    // Simplifying: One work order for the whole proposal, with checklist items built from deliverables.
    const checklist: ProposalChecklistItem[] = [];
    const phases = (proposal.phases as ProposalPhase[] | null) ?? [];
    const proposalClient = proposal.clients as { company_name?: string | null } | null;
    
    phases.forEach((phase) => {
      phase.phase_deliverables.forEach((del) => {
        checklist.push({
          id: del.id,
          title: `[${phase.name}] ${del.name}`,
          description_text: del.description,
          completed: false,
          category: del.category
        });
      });
      // Only include selected ADDONS
      phase.phase_addons?.forEach((addon) => {
        if (addon.selected) {
          checklist.push({
            id: addon.id,
            title: `[${phase.name}] ${addon.name} (Add-on)`,
            description_text: addon.description,
            completed: false,
            category: addon.category
          });
        }
      });
    });

    const { data: workOrder, error: woError } = await supabase
      .from('work_orders')
      .insert({
        organization_id: ctx.organizationId,
        proposal_id: proposal.id,
        wo_number: `WO-${proposal.name.substring(0, 5).toUpperCase()}-${Math.floor(Math.random()*1000)}`,
        title: `Work Order: ${proposal.name}`,
        description: `Generated from approved proposal.\nClient: ${proposalClient?.company_name || 'N/A'}\n${proposal.subtitle || ''}`.trim(),
        status: 'draft',
        checklist: checklist,
        priority: 'medium',
        budget_range: `Currency: ${proposal.currency || 'USD'} (Total Value: ${proposal.total_value})`
      })
      .select()
      .single();

    if (woError) throw woError;

    // Optional: mark proposal as in_production
    await supabase.from('proposals').update({ status: 'in_production' }).eq('id', proposalId);

    return NextResponse.json({ workOrder }, { status: 201 });
  } catch (error: unknown) {
    log.error('Error in quote-to-job conversion', {}, error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
