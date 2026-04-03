import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';

export async function GET(request: NextRequest) {
  const perm = await checkPermission('proposals', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = await createClient();
  const url = new URL(request.url);
  const status = url.searchParams.get('status');
  const clientId = url.searchParams.get('client_id');
  const search = url.searchParams.get('search');

  let query = supabase
    .from('proposals')
    .select('*, clients(company_name)')
    .eq('organization_id', perm.organizationId)
    .order('updated_at', { ascending: false });

  if (status) query = query.eq('status', status);
  if (clientId) query = query.eq('client_id', clientId);
  if (search) query = query.ilike('name', `%${search}%`);

  const { data: proposals, error } = await query;

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch proposals', details: error.message }, { status: 500 });
  }

  return NextResponse.json({ proposals: proposals ?? [] });
}

export async function POST(request: Request) {
  try {
    // Permission check
    const permResult = await checkPermission('proposals', 'create');
    if (!permResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!permResult.allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { userId, organizationId } = permResult;
    const body = await request.json();
    const { projectSetup, venues, phases, team, status = 'draft' } = body;

    const supabase = await createClient();

    // Calculate totals from phases
    let totalValue = 0;
    let totalWithAddons = 0;
    for (const phase of phases) {
      const deliverablesTotal = (phase.deliverables ?? []).reduce(
        (sum: number, d: { totalCost: number }) => sum + d.totalCost,
        0,
      );
      const addonsTotal = (phase.addons ?? [])
        .filter((a: { selected: boolean }) => a.selected)
        .reduce((sum: number, a: { totalCost: number }) => sum + a.totalCost, 0);
      totalValue += deliverablesTotal;
      totalWithAddons += deliverablesTotal + addonsTotal;
    }

    // INSERT proposal
    const { data: proposal, error: proposalError } = await supabase
      .from('proposals')
      .insert({
        organization_id: organizationId,
        client_id: projectSetup.clientId,
        name: projectSetup.projectName || 'Untitled Proposal',
        subtitle: projectSetup.subtitle || null,
        version: 1,
        status,
        currency: 'USD',
        total_value: totalValue,
        total_with_addons: totalWithAddons,
        narrative_context: {
          brandVoice: projectSetup.brandVoice || undefined,
          audienceProfile: projectSetup.audienceProfile || undefined,
          experienceGoal: projectSetup.experienceGoal || undefined,
        },
        payment_terms: {
          structure: 'deposit_balance',
          depositPercent: projectSetup.depositPercent,
          balancePercent: projectSetup.balancePercent,
        },
        phase_template_id: projectSetup.phaseTemplateId || null,
        prepared_date: new Date().toISOString(),
        created_by: userId,
        tags: [],
      })
      .select('id')
      .single();

    if (proposalError || !proposal) {
      console.error('Failed to insert proposal:', proposalError);
      return NextResponse.json(
        { error: 'Failed to create proposal', details: proposalError?.message },
        { status: 500 },
      );
    }

    const proposalId = proposal.id;

    // INSERT venues
    if (venues && venues.length > 0) {
      const venueRows = venues.map(
        (v: {
          name: string;
          address: Record<string, unknown>;
          type: string;
          activationDates: Record<string, unknown> | null;
          loadIn: Record<string, unknown> | null;
          strike: Record<string, unknown> | null;
          notes: string;
        }, i: number) => ({
          proposal_id: proposalId,
          name: v.name || `Venue ${i + 1}`,
          address: v.address ?? {},
          type: v.type || '',
          activation_dates: v.activationDates ?? null,
          load_in: v.loadIn ?? null,
          strike: v.strike ?? null,
          site_constraints: {},
          contact_on_site: null,
          sequence: i,
          notes: v.notes || null,
        }),
      );

      const { error: venueError } = await supabase.from('venues').insert(venueRows);
      if (venueError) {
        console.error('Failed to insert venues:', venueError);
      }
    }

    // INSERT team assignments
    if (team && team.length > 0) {
      const teamRows = team.map(
        (t: { role: string; userId: string; facilityId: string }) => ({
          proposal_id: proposalId,
          role: t.role,
          user_id: t.userId,
          facility_id: t.facilityId || null,
        }),
      );

      const { error: teamError } = await supabase
        .from('team_assignments')
        .insert(teamRows);
      if (teamError) {
        console.error('Failed to insert team assignments:', teamError);
      }
    }

    // INSERT phases, deliverables, addons, milestones
    for (let i = 0; i < phases.length; i++) {
      const phase = phases[i];

      const phaseInvestment = (phase.deliverables ?? []).reduce(
        (sum: number, d: { totalCost: number }) => sum + d.totalCost,
        0,
      );

      const { data: phaseRow, error: phaseError } = await supabase
        .from('phases')
        .insert({
          proposal_id: proposalId,
          phase_number: phase.number || String(i + 1),
          name: phase.name || `Phase ${i + 1}`,
          subtitle: phase.subtitle || null,
          status: 'not_started',
          terms_sections: [],
          narrative: phase.narrative || null,
          phase_investment: phaseInvestment,
          sort_order: i,
        })
        .select('id')
        .single();

      if (phaseError || !phaseRow) {
        console.error(`Failed to insert phase ${i + 1}:`, phaseError);
        continue;
      }

      const phaseId = phaseRow.id;

      // INSERT deliverables
      if (phase.deliverables && phase.deliverables.length > 0) {
        const delRows = phase.deliverables.map(
          (d: {
            name: string;
            description: string;
            category: string;
            unit: string;
            qty: number;
            unitCost: number;
            totalCost: number;
          }, j: number) => ({
            phase_id: phaseId,
            name: d.name || 'Unnamed',
            description: d.description || null,
            details: [],
            category: d.category || '',
            unit: d.unit || 'unit',
            qty: d.qty,
            unit_cost: d.unitCost,
            total_cost: d.totalCost,
            is_taxable: false,
            sort_order: j,
          }),
        );

        const { error: delError } = await supabase
          .from('phase_deliverables')
          .insert(delRows);
        if (delError) {
          console.error(`Failed to insert deliverables for phase ${i + 1}:`, delError);
        }
      }

      // INSERT addons
      if (phase.addons && phase.addons.length > 0) {
        const addonRows = phase.addons.map(
          (a: {
            name: string;
            description: string;
            category: string;
            unit: string;
            qty: number;
            unitCost: number;
            totalCost: number;
            selected: boolean;
            mutuallyExclusiveGroup: string;
          }, j: number) => ({
            phase_id: phaseId,
            name: a.name || 'Unnamed',
            description: a.description || null,
            category: a.category || '',
            unit: a.unit || 'unit',
            qty: a.qty,
            unit_cost: a.unitCost,
            total_cost: a.totalCost,
            is_taxable: false,
            is_selected: a.selected ?? false,
            mutually_exclusive_group: a.mutuallyExclusiveGroup || null,
            sort_order: j,
          }),
        );

        const { error: addonError } = await supabase
          .from('phase_addons')
          .insert(addonRows);
        if (addonError) {
          console.error(`Failed to insert addons for phase ${i + 1}:`, addonError);
        }
      }

      // INSERT milestone gate + requirements
      if (phase.milestone && phase.milestone.name) {
        const { data: milestoneRow, error: milestoneError } = await supabase
          .from('milestone_gates')
          .insert({
            phase_id: phaseId,
            name: phase.milestone.name,
            unlocks_description: null,
            status: 'pending',
          })
          .select('id')
          .single();

        if (milestoneError || !milestoneRow) {
          console.error(`Failed to insert milestone for phase ${i + 1}:`, milestoneError);
        } else if (
          phase.milestone.requirements &&
          phase.milestone.requirements.length > 0
        ) {
          const reqRows = phase.milestone.requirements.map(
            (r: { text: string; assignee: string }, k: number) => ({
              milestone_id: milestoneRow.id,
              text: r.text,
              status: 'pending',
              assignee: r.assignee || 'producer',
              evidence_required: false,
              sort_order: k,
            }),
          );

          const { error: reqError } = await supabase
            .from('milestone_requirements')
            .insert(reqRows);
          if (reqError) {
            console.error(`Failed to insert requirements for phase ${i + 1}:`, reqError);
          }
        }
      }
    }

    return NextResponse.json({ id: proposalId }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error creating proposal:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
