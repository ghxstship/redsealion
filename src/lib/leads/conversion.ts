import { createServiceClient } from '@/lib/supabase/server';
import { createLogger } from '@/lib/logger';
import { randomUUID } from 'crypto';

const log = createLogger('lib-leads-conversion');

/**
 * Automates the creation of an entire project lifecycle (Client -> Deal -> Proposal)
 * directly from a lead submission. Sets FK back-references on the lead record to
 * maintain SSOT traceability (converted_to_client_id, converted_to_contact_id,
 * converted_to_deal_id).
 *
 * @param leadId The ID of the newly created lead
 * @param orgId The organization to which the lead belongs
 */
export async function convertLeadToProject(leadId: string, orgId: string): Promise<boolean> {
  const supabase = await createServiceClient();

  try {
    // 1. Fetch the lead
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .eq('organization_id', orgId)
      .single();

    if (leadError || !lead) {
      log.error(`Failed to fetch lead for conversion: ${leadId}`, {}, leadError);
      return false;
    }

    if (lead.status === 'converted' && lead.converted_to_deal_id) {
      return true;
    }

    const contactFirst = (lead as Record<string, unknown>).contact_first_name as string || 'Unknown';
    const contactLast = (lead as Record<string, unknown>).contact_last_name as string || '';
    const companyName = lead.company_name || `${contactFirst} ${contactLast}`.trim() || 'Individual Client';

    // 2. Create the Client
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .insert({
        organization_id: orgId,
        company_name: companyName,
        source: lead.source || 'Website Intake',
        notes: lead.message || null,
      })
      .select('id')
      .single();

    if (clientError || !client) {
      log.error(`Failed to create client from lead: ${leadId}`, {}, clientError);
      return false;
    }

    // 3. Create Client Contact
    const { data: contact, error: contactError } = await supabase
      .from('client_contacts')
      .insert({
        client_id: client.id,
        first_name: contactFirst,
        last_name: contactLast,
        email: lead.contact_email || `${randomUUID()}@unknown.com`,
        phone: lead.contact_phone || null,
        contact_role: 'primary',
        is_decision_maker: true,
        is_signatory: true,
      })
      .select('id')
      .single();

    if (contactError) {
      log.error(`Failed to create client contact from lead: ${leadId}`, {}, contactError);
    }

    // 4. Create the Deal
    const dealTitle = `New Deal - ${companyName}`;
    const { data: deal, error: dealError } = await supabase
      .from('deals')
      .insert({
        organization_id: orgId,
        client_id: client.id,
        title: dealTitle,
        deal_value: lead.estimated_budget || 0,
        stage: 'lead',
        probability: 10,
        notes: lead.message || null,
      })
      .select('id')
      .single();

    if (dealError || !deal) {
      log.error(`Failed to create deal from lead: ${leadId}`, {}, dealError);
      return false;
    }

    // 5. Create the Proposal (Project) — deal_stage now lives on deals, not proposals
    const { data: orgData } = await supabase
      .from('organizations')
      .select('currency')
      .eq('id', orgId)
      .single();

    const currency = (orgData as Record<string, unknown>)?.currency as string || 'USD';

    // Resolve the org owner to use as created_by (FK requires valid user)
    const { data: ownerMembership } = await supabase
      .from('organization_memberships')
      .select('user_id')
      .eq('organization_id', orgId)
      .eq('status', 'active')
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    const createdBy = ownerMembership?.user_id as string | null;

    const { error: proposalError } = await supabase
      .from('proposals')
      .insert({
        organization_id: orgId,
        client_id: client.id,
        name: lead.event_type || dealTitle,
        status: 'draft',
        currency,
        total_value: lead.estimated_budget || 0,
        total_with_addons: lead.estimated_budget || 0,
        source: lead.source || 'Website Intake',
        created_by: createdBy,
      });

    if (proposalError) {
      log.error(`Failed to create proposal from lead: ${leadId}`, {}, proposalError);
      return false;
    }

    // 6. Mark Lead as converted with FK back-references
    const { error: updateError } = await supabase
      .from('leads')
      .update({
        status: 'converted',
        converted_to_deal_id: deal.id,
        converted_to_client_id: client.id,
        converted_to_contact_id: contact?.id || null,
      } as Record<string, unknown>)
      .eq('id', leadId);

    if (updateError) {
      log.error(`Failed to mark lead ${leadId} as converted`, {}, updateError);
    }

    log.info(`Successfully converted lead ${leadId} into project lifecycle`);
    return true;
  } catch (err) {
    log.error(`Exception during lead conversion for ${leadId}`, {}, err);
    return false;
  }
}
