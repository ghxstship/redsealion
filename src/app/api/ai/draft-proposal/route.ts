import { NextRequest, NextResponse } from 'next/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { createClient } from '@/lib/supabase/server';

/**
 * AI Proposal Drafting endpoint.
 * Takes lead context and generates a draft proposal structure
 * using existing templates and historical data patterns.
 */
export async function POST(request: NextRequest) {
  const perm = await checkPermission('ai_drafting', 'create');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const { lead_id, client_id, event_type, estimated_budget, description } = body;

  const supabase = await createClient();

  // 1. Fetch the org's phase template for structure
  const { data: org } = await supabase
    .from('organizations')
    .select('default_phase_template_id, currency, proposal_prefix')
    .eq('id', perm.organizationId)
    .single();

  let templatePhases: Array<Record<string, unknown>> = [];
  if (org?.default_phase_template_id) {
    const { data: template } = await supabase
      .from('phase_templates')
      .select('phases')
      .eq('id', org.default_phase_template_id)
      .single();
    if (template?.phases) templatePhases = template.phases as Array<Record<string, unknown>>;
  }

  // 2. Fetch recent proposals for pricing patterns
  const { data: recentProposals } = await supabase
    .from('proposals')
    .select('name, total_value, status')
    .eq('organization_id', perm.organizationId)
    .in('status', ['approved', 'complete'])
    .order('created_at', { ascending: false })
    .limit(10);

  const avgValue = recentProposals && recentProposals.length > 0
    ? recentProposals.reduce((sum: number, p: Record<string, unknown>) => sum + ((p.total_value as number) ?? 0), 0) / recentProposals.length
    : 50000;

  // 3. Resolve client name if provided
  let clientName = 'Prospective Client';
  if (client_id) {
    const { data: client } = await supabase
      .from('clients')
      .select('company_name')
      .eq('id', client_id)
      .single();
    if (client) clientName = client.company_name;
  } else if (lead_id) {
    const { data: lead } = await supabase
      .from('leads')
      .select('company_name, contact_first_name')
      .eq('id', lead_id)
      .single();
    if (lead) clientName = lead.company_name || `${lead.contact_first_name}'s Project`;
  }

  // 4. Generate draft proposal structure
  const proposalName = `${clientName} — ${event_type ? event_type.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) : 'Event'} Proposal`;

  const suggestedBudget = estimated_budget || Math.round(avgValue / 1000) * 1000;

  const phases = templatePhases.length > 0
    ? templatePhases.map((phase, idx) => ({
        phase_number: (phase.number as string) || String(idx + 1),
        name: (phase.name as string) || `Phase ${idx + 1}`,
        subtitle: (phase.subtitle as string) || null,
        estimated_investment: Math.round(suggestedBudget / templatePhases.length),
        suggested_deliverables: ((phase.defaultDeliverables as Array<Record<string, unknown>>) ?? []).map((d) => ({
          name: d.name,
          description: d.description,
          category: d.category,
          suggested_cost: Math.round(suggestedBudget / templatePhases.length / 3),
        })),
      }))
    : [
        { phase_number: '1', name: 'Design & Concept', subtitle: 'Creative development', estimated_investment: Math.round(suggestedBudget * 0.3), suggested_deliverables: [] },
        { phase_number: '2', name: 'Production', subtitle: 'Build & fabrication', estimated_investment: Math.round(suggestedBudget * 0.5), suggested_deliverables: [] },
        { phase_number: '3', name: 'Activation', subtitle: 'Install, operate & strike', estimated_investment: Math.round(suggestedBudget * 0.2), suggested_deliverables: [] },
      ];

  const draft = {
    name: proposalName,
    subtitle: description || `${event_type ? event_type.replace(/_/g, ' ') : 'Event'} production proposal for ${clientName}`,
    client_name: clientName,
    client_id: client_id || null,
    lead_id: lead_id || null,
    currency: org?.currency || 'USD',
    suggested_total: suggestedBudget,
    phases,
    assumptions: [
      'All pricing is based on preliminary scope; final pricing subject to site survey.',
      'Client is responsible for securing event permits and venue access.',
      'Timeline assumes standard lead times for materials and equipment.',
    ],
  };

  return NextResponse.json({ success: true, draft });
}
