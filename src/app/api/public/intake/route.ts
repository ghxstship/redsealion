import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { convertLeadToProject } from '@/lib/leads/conversion';
import { createLogger } from '@/lib/logger';
import { serveRateLimit } from '@/lib/api/rate-limit';

const log = createLogger('api-public-intake');

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 10 submissions per minute per IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    const { success: withinLimit } = await serveRateLimit(`intake_${ip}`, 10, 60000);
    if (!withinLimit) {
      return NextResponse.json(
        { error: 'Too many submissions. Please try again later.' },
        { status: 429, headers: { 'Retry-After': '60' } },
      );
    }
    const body = await request.json().catch(() => ({}));
    const {
      form_id, // could be form id or org_id
      organization_id,
      source,
      company_name,
      contact_name,
      contact_first_name,
      contact_last_name,
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

    // Support both legacy contact_name and new first/last split
    const firstName = contact_first_name || (contact_name ? contact_name.split(' ')[0] : '');
    const lastName = contact_last_name || (contact_name ? contact_name.split(' ').slice(1).join(' ') : '');

    if (!firstName || !contact_email) {
      return NextResponse.json(
        { error: 'contact_first_name (or contact_name) and contact_email are required.' },
        { status: 400 },
      );
    }

    // We use the service client since this is a public endpoint with no logged-in user
    const supabase = await createServiceClient();

    // Dedup check: if a lead with the same email exists in this org, update it instead of creating duplicate
    if (contact_email) {
      const { data: existing } = await supabase
        .from('leads')
        .select('id')
        .eq('organization_id', targetOrgId)
        .eq('contact_email', contact_email)
        .limit(1)
        .maybeSingle();

      if (existing) {
        log.info(`Duplicate lead detected (email: ${contact_email}). Updating existing lead ${existing.id}.`);
        const updatePayload: Record<string, unknown> = {
          status: 'new',
          updated_at: new Date().toISOString(),
        };
        if (message) updatePayload.message = message;
        if (estimated_budget) updatePayload.estimated_budget = Number(estimated_budget);
        if (event_type) updatePayload.event_type = event_type;
        if (event_date) updatePayload.event_date = event_date;

        await supabase.from('leads').update(updatePayload).eq('id', existing.id);
        return NextResponse.json({ success: true, lead_id: existing.id, deduplicated: true });
      }
    }

    // 1. Insert into leads table
    const { data: lead, error } = await supabase
      .from('leads')
      .insert({
        organization_id: targetOrgId,
        source: source || 'Website Intake',
        company_name: company_name || null,
        contact_first_name: firstName,
        contact_last_name: lastName,
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
