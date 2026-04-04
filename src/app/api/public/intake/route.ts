import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { convertLeadToProject } from '@/lib/leads/conversion';
import { createLogger } from '@/lib/logger';

const log = createLogger('api-public-intake');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      form_id, // could be form id or org_id
      organization_id,
      source,
      company_name,
      contact_name,
      contact_email,
      contact_phone,
      event_type,
      event_date,
      estimated_budget,
      message,
    } = body;

    // organization_id is required
    const targetOrgId = organization_id || form_id;

    if (!targetOrgId) {
      return NextResponse.json(
        { error: 'organization_id or form_id is required.' },
        { status: 400 },
      );
    }

    if (!contact_name || !contact_email) {
      return NextResponse.json(
        { error: 'contact_name and contact_email are required.' },
        { status: 400 },
      );
    }

    // We use the service client since this is a public endpoint with no logged-in user
    const supabase = await createServiceClient();

    // 1. Insert into leads table
    const { data: lead, error } = await supabase
      .from('leads')
      .insert({
        organization_id: targetOrgId,
        source: source || 'Website Intake',
        company_name: company_name || null,
        contact_name,
        contact_email: contact_email || null,
        contact_phone: contact_phone || null,
        event_type: event_type || null,
        event_date: event_date || null,
        estimated_budget: estimated_budget ? Number(estimated_budget) : null,
        message: message || null,
        status: 'new',
        // created_by is nullable, or we could leave it null for system-created
      })
      .select()
      .single();

    if (error || !lead) {
      log.error('Failed to create lead via public intake', { targetOrgId }, error);
      return NextResponse.json(
        { error: 'Failed to process lead intake.' },
        { status: 500 },
      );
    }

    log.info(`Lead created via public intake: ${lead.id}. Initiating project lifecycle...`);

    // 2. Automate Project Lifecycle (non-blocking for fast API response, but Vercel might kill it if we don't await.)
    // Note: Since we are running in Next.js Serverless runtime, we should await it so it completes
    // before the function context terminates.
    await convertLeadToProject(lead.id, targetOrgId);

    return NextResponse.json({ success: true, lead_id: lead.id });
  } catch (err) {
    log.error('Unexpected error in public intake route', {}, err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
