import { createServiceClient } from '@/lib/supabase/server';
import { createLogger } from '@/lib/logger';
import { randomUUID } from 'crypto';

const log = createLogger('lib-leads-conversion');

/**
 * Automates the creation of an entire project lifecycle (Client -> Deal -> Proposal)
 * directly from a lead submission.
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
      // Already converted
      return true;
    }

    const companyName = lead.company_name || lead.contact_name || 'Individual Client';

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
    const { error: contactError } = await supabase
      .from('client_contacts')
      .insert({
        client_id: client.id,
        first_name: lead.contact_name?.split(' ')[0] || 'Unknown',
        last_name: lead.contact_name?.split(' ').slice(1).join(' ') || '',
        email: lead.contact_email || `${randomUUID()}@unknown.com`,
        phone: lead.contact_phone || null,
        contact_role: 'primary',
        is_decision_maker: true,
        is_signatory: true,
      });

    if (contactError) {
      log.error(`Failed to create client contact from lead: ${leadId}`, {}, contactError);
      // Non-fatal, we can continue
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
        probability: 10, // Initial default
        notes: lead.message || null,
      })
      .select('id')
      .single();

    if (dealError || !deal) {
      log.error(`Failed to create deal from lead: ${leadId}`, {}, dealError);
      return false;
    }

    // 5. Create the Proposal (Project)
    const { data: orgData } = await supabase
      .from('organizations')
      .select('settings')
      .eq('id', orgId)
      .single();

    const currency = (orgData?.settings as any)?.currency || 'USD';

    const { error: proposalError } = await supabase
      .from('proposals')
      .insert({
        organization_id: orgId,
        client_id: client.id,
        name: lead.event_type || dealTitle,
        status: 'draft',
        deal_stage: 'lead',
        currency,
        total_value: lead.estimated_budget || 0,
        total_with_addons: lead.estimated_budget || 0,
        source: lead.source || 'Website Intake',
        created_by: '00000000-0000-0000-0000-000000000000', // System user or a default admin placeholder
      });

    if (proposalError) {
      log.error(`Failed to create proposal from lead: ${leadId}`, {}, proposalError);
      return false;
    }

    // 6. Mark Lead as converted
    const { error: updateError } = await supabase
      .from('leads')
      .update({
        status: 'converted',
        converted_to_deal_id: deal.id,
      })
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
