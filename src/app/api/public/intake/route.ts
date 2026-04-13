import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { convertLeadToProject } from '@/lib/leads/conversion';
import { notifyLeadReceived } from '@/lib/notifications/triggers';
import { createLogger } from '@/lib/logger';
import { serveRateLimit } from '@/lib/api/rate-limit';

const log = createLogger('api-public-intake');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
} as const;

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 10 submissions per minute per IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    const { success: withinLimit } = await serveRateLimit(`intake_${ip}`, 10, 60000);
    if (!withinLimit) {
      return NextResponse.json(
        { error: 'Too many submissions. Please try again later.' },
        { status: 429, headers: { ...CORS_HEADERS, 'Retry-After': '60' } },
      );
    }
    const body = await request.json().catch(() => ({}));
    const {
      form_id, // could be form id or org_id
      embed_token, // can be passed instead of form_id
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

    const supabase = await createServiceClient();

    let targetOrgId = organization_id || form_id;
    let actualFormId: string | null = null;
    let autoResponseEnabled = false;
    let autoResponseSubject = '';
    let autoResponseBody = '';
    let thankYouMessage = 'Thank you! Your submission has been received.';
    let redirectUrl: string | null = null;

    // If an embed token is provided, lookup the actual form
    if (embed_token) {
      const { data: form } = await supabase
        .from('lead_forms')
        .select('*')
        .eq('embed_token', embed_token)
        .eq('is_active', true)
        .single();
        
      if (form) {
        actualFormId = form.id;
        targetOrgId = form.organization_id;
        autoResponseEnabled = form.auto_response_enabled;
        autoResponseSubject = form.auto_response_subject;
        autoResponseBody = form.auto_response_body;
        if (form.thank_you_message) thankYouMessage = form.thank_you_message;
        if (form.redirect_url) redirectUrl = form.redirect_url;
      } else {
        return NextResponse.json(
          { error: 'Invalid or inactive form token.' },
          { status: 400, headers: CORS_HEADERS },
        );
      }
    }

    if (!targetOrgId) {
      return NextResponse.json(
        { error: 'organization_id, form_id, or embed_token is required.' },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    // Support both legacy contact_name and new first/last split
    const firstName = contact_first_name || (contact_name ? contact_name.split(' ')[0] : '');
    const lastName = contact_last_name || (contact_name ? contact_name.split(' ').slice(1).join(' ') : '');

    if (!firstName || !contact_email) {
      return NextResponse.json(
        { error: 'contact_first_name (or contact_name) and contact_email are required.' },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    // Dedup check
    let targetLeadId: string | null = null;
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
        targetLeadId = existing.id;
        const updatePayload: Record<string, unknown> = {
          status: 'new',
          updated_at: new Date().toISOString(),
        };
        if (message) updatePayload.message = message;
        if (estimated_budget) updatePayload.estimated_budget = Number(estimated_budget);
        if (event_type) updatePayload.event_type = event_type;
        if (event_date) updatePayload.event_date = event_date;
        if (actualFormId) updatePayload.form_id = actualFormId;

        await supabase.from('leads').update(updatePayload).eq('id', existing.id);
      }
    }

    if (!targetLeadId) {
      // Insert into leads table
      const { data: lead, error } = await supabase
        .from('leads')
        .insert({
          organization_id: targetOrgId,
          form_id: actualFormId,
          source: source || 'website',
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
        })
        .select()
        .single();

      if (error || !lead) {
        log.error('Failed to create lead via public intake', { targetOrgId }, error);
        return NextResponse.json(
          { error: 'Failed to process lead intake.' },
          { status: 500, headers: CORS_HEADERS },
        );
      }
      targetLeadId = lead.id;
    }

    // Record the form submission if applicable
    if (actualFormId) {
      await supabase.from('lead_form_submissions').insert({
        form_id: actualFormId,
        lead_id: targetLeadId,
        organization_id: targetOrgId,
        raw_data: body,
        ip_address: ip,
        user_agent: request.headers.get('user-agent') ?? null,
      });
    }

    log.info(`Lead created via public intake: ${targetLeadId}. Initiating processes...`);

    // Handle auto-response
    const pendingPromises = [];
    
    pendingPromises.push(convertLeadToProject(targetLeadId!, targetOrgId!));
    pendingPromises.push(notifyLeadReceived(targetLeadId!, targetOrgId!));

    if (autoResponseEnabled && autoResponseSubject && autoResponseBody) {
      pendingPromises.push(
        supabase.from('email_notifications').insert({
          organization_id: targetOrgId,
          recipient_email: contact_email,
          recipient_name: firstName,
          subject: autoResponseSubject,
          body: autoResponseBody,
          type: 'auto_response',
          related_entity_type: 'lead',
          related_entity_id: targetLeadId,
        })
      );
    }

    await Promise.allSettled(pendingPromises);

    return NextResponse.json(
      { 
        success: true, 
        lead_id: targetLeadId, 
        thank_you_message: thankYouMessage,
        redirect_url: redirectUrl
      }, 
      { headers: CORS_HEADERS }
    );
  } catch (err) {
    log.error('Unexpected error in public intake route', {}, err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}

/** CORS preflight handler */
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}
