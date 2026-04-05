import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { createLogger } from '@/lib/logger';

const log = createLogger('api-public-portal-request');

/**
 * Public API endpoint for portal-based work requests.
 * Similar to the public intake endpoint, but specifically sourced from the
 * client portal self-service flow. Does NOT require authentication.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      organization_id,
      source,
      contact_name,
      contact_email,
      contact_phone,
      event_type,
      event_date,
      estimated_budget,
      message,
    } = body;

    if (!organization_id) {
      return NextResponse.json(
        { error: 'organization_id is required.' },
        { status: 400 },
      );
    }

    // Support full name → first/last split
    const nameParts = (contact_name || '').trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    if (!firstName || !contact_email) {
      return NextResponse.json(
        { error: 'contact_name and contact_email are required.' },
        { status: 400 },
      );
    }

    const supabase = await createServiceClient();

    // Verify organization exists
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('id', organization_id)
      .single();

    if (!org) {
      return NextResponse.json(
        { error: 'Invalid organization.' },
        { status: 400 },
      );
    }

    // Insert as a lead with 'Client Portal' source
    const { data: lead, error } = await supabase
      .from('leads')
      .insert({
        organization_id,
        source: source || 'Client Portal',
        company_name: null,
        contact_first_name: firstName,
        contact_last_name: lastName,
        contact_email: contact_email || null,
        contact_phone: contact_phone || null,
        event_type: event_type || null,
        event_date: event_date || null,
        estimated_budget: estimated_budget ? Number(estimated_budget) : null,
        message: message || null,
        status: 'new',
      })
      .select()
      .single();

    if (error || !lead) {
      log.error('Failed to create lead via portal request', { organization_id }, error);
      return NextResponse.json(
        { error: 'Failed to submit request.' },
        { status: 500 },
      );
    }

    log.info(`Portal work request created as lead: ${lead.id}`);

    return NextResponse.json({ success: true, lead_id: lead.id });
  } catch (err) {
    log.error('Unexpected error in portal-request route', {}, err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
