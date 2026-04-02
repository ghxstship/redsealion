import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { sendEmail } from '@/lib/email';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const permResult = await checkPermission('proposals', 'edit');
    if (!permResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!permResult.allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { organizationId } = permResult;
    const supabase = await createClient();

    // Fetch proposal with client info
    const { data: proposal, error: fetchError } = await supabase
      .from('proposals')
      .select('id, name, status, client_id, organization_id')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single();

    if (fetchError || !proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }

    // Generate portal access token
    const portalToken = crypto.randomUUID();

    // Update proposal status to sent
    const { error: updateError } = await supabase
      .from('proposals')
      .update({
        status: 'sent',
        portal_access_token: portalToken,
      })
      .eq('id', id);

    if (updateError) {
      console.error('Failed to update proposal status:', updateError);
      return NextResponse.json(
        { error: 'Failed to send proposal', details: updateError.message },
        { status: 500 },
      );
    }

    // Fetch primary client contact email
    const { data: contact } = await supabase
      .from('client_contacts')
      .select('email, first_name, last_name')
      .eq('client_id', proposal.client_id)
      .eq('role', 'primary')
      .maybeSingle();

    // Build portal URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    const portalUrl = `${baseUrl}/portal/${id}?token=${portalToken}`;

    // Send email if we have a contact
    if (contact?.email) {
      const recipientName = [contact.first_name, contact.last_name]
        .filter(Boolean)
        .join(' ');

      await sendEmail({
        to: contact.email,
        toName: recipientName || undefined,
        subject: `Proposal: ${proposal.name}`,
        body: `You have a new proposal to review: ${proposal.name}\n\nView your proposal here: ${portalUrl}`,
        html: `
          <h2>You have a new proposal to review</h2>
          <p><strong>${proposal.name}</strong></p>
          <p><a href="${portalUrl}">View Proposal</a></p>
        `,
      });
    }

    return NextResponse.json({
      success: true,
      proposal_id: id,
      portal_access_token: portalToken,
      portalUrl,
    });
  } catch (error) {
    console.error('Unexpected error sending proposal:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
