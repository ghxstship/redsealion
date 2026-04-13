import { NextRequest, NextResponse } from 'next/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { requireFeature } from '@/lib/api/tier-guard';
import { createClient } from '@/lib/supabase/server';
import { getCopilotModel, isAiConfigured } from '@/lib/ai/client';
import { generateText } from 'ai';
import { createLogger } from '@/lib/logger';

const log = createLogger('api-ai-draft-proposal');

type ModelUsage = {
  promptTokens?: number;
  completionTokens?: number;
};

/**
 * AI Proposal Drafting endpoint.
 * Takes lead context and generates a draft proposal structure.
 * Uses AI for intelligent scope descriptions when configured,
 * falls back to deterministic templates otherwise.
 */
export async function POST(request: NextRequest) {
  // Tier gate: ai_drafting requires enterprise tier
  const tierError = await requireFeature('ai_drafting');
  if (tierError) return tierError;

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

  // 5. Phase structure — deterministic from template
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
        narrative: '',
      }))
    : [
        { phase_number: '1', name: 'Design & Concept', subtitle: 'Creative development', estimated_investment: Math.round(suggestedBudget * 0.3), suggested_deliverables: [], narrative: '' },
        { phase_number: '2', name: 'Production', subtitle: 'Build & fabrication', estimated_investment: Math.round(suggestedBudget * 0.5), suggested_deliverables: [], narrative: '' },
        { phase_number: '3', name: 'Activation', subtitle: 'Install, operate & strike', estimated_investment: Math.round(suggestedBudget * 0.2), suggested_deliverables: [], narrative: '' },
      ];

  // 6. AI-enhanced content generation (GAP-15)
  let aiSubtitle = description || `${event_type ? event_type.replace(/_/g, ' ') : 'Event'} production proposal for ${clientName}`;
  let aiAssumptions = [
    'All pricing is based on preliminary scope; final pricing subject to site survey.',
    'Client is responsible for securing event permits and venue access.',
    'Timeline assumes standard lead times for materials and equipment.',
  ];

  if (isAiConfigured()) {
    try {
      const phaseList = phases.map((p) => `${p.name} ($${p.estimated_investment.toLocaleString()})`).join(', ');
      const prompt = `You are an experiential production proposal writer. Generate content for a proposal draft.

Client: ${clientName}
Event Type: ${event_type || 'General Event'}
Budget: $${suggestedBudget.toLocaleString()}
${description ? `Description: ${description}` : ''}
Phases: ${phaseList}

Respond in JSON with these exact keys:
{
  "subtitle": "A compelling one-line subtitle (max 15 words)",
  "assumptions": ["assumption1", "assumption2", "assumption3", "assumption4"],
  "phase_narratives": { "1": "narrative for phase 1", "2": "narrative for phase 2", ... }
}

Rules:
- Subtitle should be engaging and specific to the client/event
- Assumptions should be practical, specific, and relevant to experiential production
- Phase narratives should be 1-2 sentences describing deliverables and approach
- Use professional but warm tone
- Output ONLY valid JSON, no markdown or preamble`;

      const result = await generateText({
        model: getCopilotModel(),
        prompt,
        temperature: 0.4,
      });

      const parsed = JSON.parse(result.text);
      if (parsed.subtitle) aiSubtitle = parsed.subtitle;
      if (Array.isArray(parsed.assumptions) && parsed.assumptions.length > 0) {
        aiAssumptions = parsed.assumptions;
      }
      if (parsed.phase_narratives) {
        for (const phase of phases) {
          const narrative = parsed.phase_narratives[phase.phase_number];
          if (narrative) phase.narrative = narrative;
        }
      }

      const usage = result.usage as ModelUsage | undefined;
      if (usage) {
        await supabase.from('ai_usage_log').insert({
          organization_id: perm.organizationId,
          user_id: perm.userId,
          model: 'claude-sonnet-4-20250514',
          input_tokens: usage.promptTokens ?? 0,
          output_tokens: usage.completionTokens ?? 0,
          estimated_cost_usd: ((usage.promptTokens ?? 0) * 3 + (usage.completionTokens ?? 0) * 15) / 1_000_000,
          tool_calls_count: 0,
        });
      }
    } catch (aiError) {
      // AI enhancement failed — fall back to deterministic content
      log.warn('AI content generation failed, using fallback', { error: String(aiError) });
    }
  }

  const draft = {
    name: proposalName,
    subtitle: aiSubtitle,
    client_name: clientName,
    client_id: client_id || null,
    lead_id: lead_id || null,
    currency: org?.currency || 'USD',
    suggested_total: suggestedBudget,
    phases,
    assumptions: aiAssumptions,
  };

  return NextResponse.json({ success: true, draft });
}
