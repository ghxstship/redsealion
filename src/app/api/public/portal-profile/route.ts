import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { createLogger } from '@/lib/logger';

const log = createLogger('api-portal-profile');

/**
 * PUT /api/public/portal-profile
 *
 * Allows portal users to update their client contact profile.
 * Identifies the user by their authenticated email.
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { first_name, last_name, phone, title, organization_id } = body as {
      first_name?: string;
      last_name?: string;
      phone?: string;
      title?: string;
      organization_id?: string;
    };

    if (!first_name?.trim()) {
      return NextResponse.json(
        { error: 'first_name is required.' },
        { status: 400 },
      );
    }

    const serviceClient = await createServiceClient();

    // GAP-PTL-18: Scope client_contact lookup by organization to handle
    // the same email existing across multiple orgs.
    let contactId: string | null = null;

    if (organization_id) {
      // Find contacts for clients in this specific org
      const { data: contacts } = await serviceClient
        .from('client_contacts')
        .select('id, client_id, clients!inner(organization_id)')
        .eq('email', user.email)
        .eq('clients.organization_id', organization_id)
        .limit(1);

      contactId = contacts?.[0]?.id ?? null;
    }

    // Fallback: if no org specified or no match, try global email match
    if (!contactId) {
      const { data: contact } = await serviceClient
        .from('client_contacts')
        .select('id')
        .eq('email', user.email)
        .limit(1)
        .maybeSingle();

      contactId = contact?.id ?? null;
    }

    if (!contactId) {
      return NextResponse.json(
        { error: 'No client account found for your email.' },
        { status: 404 },
      );
    }

    const { error: updateError } = await serviceClient
      .from('client_contacts')
      .update({
        first_name: first_name.trim(),
        last_name: (last_name ?? '').trim(),
        phone: phone?.trim() || null,
        title: title?.trim() || null,
      })
      .eq('id', contactId);

    if (updateError) {
      log.error('Failed to update client contact', { contactId }, updateError);
      return NextResponse.json({ error: 'Failed to update profile.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    log.error('Error in portal-profile route', {}, err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
