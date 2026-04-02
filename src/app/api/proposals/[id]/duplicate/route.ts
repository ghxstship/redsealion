import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const permResult = await checkPermission('proposals', 'create');
    if (!permResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!permResult.allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { userId, organizationId } = permResult;
    const supabase = await createClient();

    // Fetch the original proposal
    const { data: original, error: fetchError } = await supabase
      .from('proposals')
      .select('*')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single();

    if (fetchError || !original) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }

    // Create the duplicate proposal
    const { data: newProposal, error: insertError } = await supabase
      .from('proposals')
      .insert({
        organization_id: original.organization_id,
        client_id: original.client_id,
        name: `${original.name} (Copy)`,
        subtitle: original.subtitle,
        version: 1,
        status: 'draft',
        currency: original.currency,
        total_value: original.total_value,
        total_with_addons: original.total_with_addons,
        narrative_context: original.narrative_context,
        payment_terms: original.payment_terms,
        phase_template_id: original.phase_template_id,
        terms_document_id: original.terms_document_id,
        prepared_date: new Date().toISOString(),
        created_by: userId,
        parent_proposal_id: original.id,
        tags: original.tags ?? [],
      })
      .select('id')
      .single();

    if (insertError || !newProposal) {
      console.error('Failed to duplicate proposal:', insertError);
      return NextResponse.json(
        { error: 'Failed to duplicate proposal', details: insertError?.message },
        { status: 500 },
      );
    }

    const newId = newProposal.id;

    // Copy venues
    const { data: venues } = await supabase
      .from('venues')
      .select('*')
      .eq('proposal_id', id)
      .order('sequence');

    if (venues && venues.length > 0) {
      const venueRows = venues.map((v) => ({
        proposal_id: newId,
        name: v.name,
        address: v.address,
        type: v.type,
        activation_dates: v.activation_dates,
        load_in: v.load_in,
        strike: v.strike,
        constraints: v.constraints,
        contact_on_site: v.contact_on_site,
        sequence: v.sequence,
        notes: v.notes,
      }));

      const { error: venueError } = await supabase.from('venues').insert(venueRows);
      if (venueError) {
        console.error('Failed to copy venues:', venueError);
      }
    }

    // Copy team assignments
    const { data: teamAssignments } = await supabase
      .from('team_assignments')
      .select('*')
      .eq('proposal_id', id);

    if (teamAssignments && teamAssignments.length > 0) {
      const teamRows = teamAssignments.map((t) => ({
        proposal_id: newId,
        role: t.role,
        user_id: t.user_id,
        facility_id: t.facility_id,
      }));

      const { error: teamError } = await supabase
        .from('team_assignments')
        .insert(teamRows);
      if (teamError) {
        console.error('Failed to copy team assignments:', teamError);
      }
    }

    // Copy phases and their children
    const { data: phases } = await supabase
      .from('phases')
      .select('*')
      .eq('proposal_id', id)
      .order('sort_order');

    if (phases && phases.length > 0) {
      for (const phase of phases) {
        const { data: newPhase, error: phaseError } = await supabase
          .from('phases')
          .insert({
            proposal_id: newId,
            number: phase.number,
            name: phase.name,
            subtitle: phase.subtitle,
            status: 'not_started',
            terms_sections: phase.terms_sections,
            narrative: phase.narrative,
            phase_investment: phase.phase_investment,
            sort_order: phase.sort_order,
          })
          .select('id')
          .single();

        if (phaseError || !newPhase) {
          console.error('Failed to copy phase:', phaseError);
          continue;
        }

        // Copy deliverables
        const { data: deliverables } = await supabase
          .from('phase_deliverables')
          .select('*')
          .eq('phase_id', phase.id)
          .order('sort_order');

        if (deliverables && deliverables.length > 0) {
          const delRows = deliverables.map((d) => ({
            phase_id: newPhase.id,
            name: d.name,
            description: d.description,
            details: d.details,
            category: d.category,
            unit: d.unit,
            qty: d.qty,
            unit_cost: d.unit_cost,
            total_cost: d.total_cost,
            taxable: d.taxable,
            terms_sections: d.terms_sections,
            pm_metadata: d.pm_metadata,
            asset_metadata: d.asset_metadata,
            resource_metadata: d.resource_metadata,
            sort_order: d.sort_order,
          }));

          await supabase.from('phase_deliverables').insert(delRows);
        }

        // Copy addons
        const { data: addons } = await supabase
          .from('phase_addons')
          .select('*')
          .eq('phase_id', phase.id)
          .order('sort_order');

        if (addons && addons.length > 0) {
          const addonRows = addons.map((a) => ({
            phase_id: newPhase.id,
            name: a.name,
            description: a.description,
            category: a.category,
            unit: a.unit,
            qty: a.qty,
            unit_cost: a.unit_cost,
            total_cost: a.total_cost,
            taxable: a.taxable,
            selected: a.selected,
            terms_sections: a.terms_sections,
            mutually_exclusive_group: a.mutually_exclusive_group,
            pm_metadata: a.pm_metadata,
            asset_metadata: a.asset_metadata,
            resource_metadata: a.resource_metadata,
            sort_order: a.sort_order,
          }));

          await supabase.from('phase_addons').insert(addonRows);
        }

        // Copy milestone gates and requirements
        const { data: milestones } = await supabase
          .from('milestone_gates')
          .select('*')
          .eq('phase_id', phase.id);

        if (milestones && milestones.length > 0) {
          for (const ms of milestones) {
            const { data: newMs } = await supabase
              .from('milestone_gates')
              .insert({
                phase_id: newPhase.id,
                name: ms.name,
                unlocks_description: ms.unlocks_description,
                status: 'pending',
              })
              .select('id')
              .single();

            if (newMs) {
              const { data: reqs } = await supabase
                .from('milestone_requirements')
                .select('*')
                .eq('milestone_id', ms.id)
                .order('sort_order');

              if (reqs && reqs.length > 0) {
                const reqRows = reqs.map((r) => ({
                  milestone_id: newMs.id,
                  text: r.text,
                  status: 'pending',
                  assignee: r.assignee,
                  due_offset: r.due_offset,
                  finance_trigger: r.finance_trigger,
                  evidence_required: r.evidence_required,
                  sort_order: r.sort_order,
                }));

                await supabase.from('milestone_requirements').insert(reqRows);
              }
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      source_proposal_id: id,
      new_proposal_id: newId,
    });
  } catch (error) {
    console.error('Unexpected error duplicating proposal:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
