/**
 * Notification trigger helpers.
 *
 * Each function fetches the required data from the database, builds a
 * template, and dispatches the notification via the existing sendNotification()
 * pipeline.
 */

import { createServiceClient } from '@/lib/supabase/server';
import { sendNotification } from './dispatcher';
import * as templates from './templates';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Fetch the first org admin's user id and email for internal notifications.
 */
async function getOrgAdmin(
  supabase: Awaited<ReturnType<typeof createServiceClient>>,
  orgId: string,
): Promise<{ userId: string; email: string } | null> {
  const { data } = await supabase
    .from('users')
    .select('id, email')
    .eq('organization_id', orgId)
    .in('role', ['org_admin', 'super_admin'])
    .limit(1)
    .single();

  if (!data) return null;
  return { userId: data.id as string, email: data.email as string };
}

// ---------------------------------------------------------------------------
// 1. Proposal sent
// ---------------------------------------------------------------------------

export async function notifyProposalSent(
  proposalId: string,
  orgId: string,
): Promise<void> {
  try {
    const supabase = await createServiceClient();

    const { data: proposal } = await supabase
      .from('proposals')
      .select('id, name, client_id, organization_id, portal_access_token')
      .eq('id', proposalId)
      .single();

    if (!proposal) return;

    const [{ data: org }, { data: contact }, admin] = await Promise.all([
      supabase
        .from('organizations')
        .select('name, slug, logo_url')
        .eq('id', orgId)
        .single(),
      supabase
        .from('client_contacts')
        .select('email, first_name, last_name')
        .eq('client_id', proposal.client_id)
        .eq('contact_role', 'primary')
        .maybeSingle(),
      getOrgAdmin(supabase, orgId),
    ]);

    if (!org || !contact?.email) return;

    const recipientName = [contact.first_name, contact.last_name]
      .filter(Boolean)
      .join(' ') || 'there';

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    const portalUrl = `${baseUrl}/portal/${org.slug}/proposals/${proposalId}`;

    const senderName = admin?.email?.split('@')[0] ?? org.name;

    const tpl = templates.proposalSent({
      recipientName,
      proposalTitle: proposal.name,
      clientPortalUrl: portalUrl,
      orgName: org.name,
      senderName,
    });

    await sendNotification({
      orgId,
      userId: admin?.userId ?? proposalId,
      eventType: 'proposal.sent',
      channel: 'email',
      subject: tpl.subject,
      body: tpl.html,
      to: contact.email,
    });
  } catch (err) {
    console.error('[Triggers] notifyProposalSent failed:', err);
  }
}

// ---------------------------------------------------------------------------
// 2. Invoice sent
// ---------------------------------------------------------------------------

export async function notifyInvoiceSent(
  invoiceId: string,
  orgId: string,
): Promise<void> {
  try {
    const supabase = await createServiceClient();

    const { data: invoice } = await supabase
      .from('invoices')
      .select('id, invoice_number, total, due_date, currency, client_id, payment_link')
      .eq('id', invoiceId)
      .single();

    if (!invoice) return;

    const [{ data: org }, { data: contact }] = await Promise.all([
      supabase
        .from('organizations')
        .select('name, slug, logo_url')
        .eq('id', orgId)
        .single(),
      supabase
        .from('client_contacts')
        .select('email, first_name, last_name')
        .eq('client_id', invoice.client_id)
        .eq('contact_role', 'primary')
        .maybeSingle(),
    ]);

    if (!org || !contact?.email) return;

    const recipientName = [contact.first_name, contact.last_name]
      .filter(Boolean)
      .join(' ') || 'there';

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    const paymentUrl =
      invoice.payment_link ??
      `${baseUrl}/portal/${org.slug}/pay/${invoiceId}`;

    const admin = await getOrgAdmin(supabase, orgId);

    const tpl = templates.invoiceSent({
      recipientName,
      invoiceNumber: invoice.invoice_number,
      amount: formatCurrency(invoice.total, invoice.currency ?? 'USD'),
      dueDate: formatDate(invoice.due_date),
      paymentUrl,
      orgName: org.name,
    });

    await sendNotification({
      orgId,
      userId: admin?.userId ?? invoiceId,
      eventType: 'invoice.sent',
      channel: 'email',
      subject: tpl.subject,
      body: tpl.html,
      to: contact.email,
    });
  } catch (err) {
    console.error('[Triggers] notifyInvoiceSent failed:', err);
  }
}

// ---------------------------------------------------------------------------
// 3. Signature requested
// ---------------------------------------------------------------------------

export async function notifySignatureRequested(
  requestId: string,
): Promise<void> {
  try {
    const supabase = await createServiceClient();

    const { data: esignReq } = await supabase
      .from('esignature_requests')
      .select('id, organization_id, document_title, signer_name, signer_email, token')
      .eq('id', requestId)
      .single();

    if (!esignReq || !esignReq.signer_email) return;

    const { data: org } = await supabase
      .from('organizations')
      .select('name, slug, logo_url')
      .eq('id', esignReq.organization_id)
      .single();

    if (!org) return;

    const admin = await getOrgAdmin(supabase, esignReq.organization_id);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    const signUrl = `${baseUrl}/portal/${org.slug}/sign/${esignReq.token}`;

    const tpl = templates.signatureRequested({
      recipientName: esignReq.signer_name ?? 'there',
      documentTitle: esignReq.document_title ?? 'Document',
      signUrl,
      orgName: org.name,
      senderName: admin?.email?.split('@')[0] ?? org.name,
    });

    await sendNotification({
      orgId: esignReq.organization_id,
      userId: admin?.userId ?? requestId,
      eventType: 'esign.requested',
      channel: 'email',
      subject: tpl.subject,
      body: tpl.html,
      to: esignReq.signer_email,
    });
  } catch (err) {
    console.error('[Triggers] notifySignatureRequested failed:', err);
  }
}

// ---------------------------------------------------------------------------
// 4. Signature completed (internal notification)
// ---------------------------------------------------------------------------

export async function notifySignatureCompleted(
  requestId: string,
): Promise<void> {
  try {
    const supabase = await createServiceClient();

    const { data: esignReq } = await supabase
      .from('esignature_requests')
      .select('id, organization_id, document_title, signer_name')
      .eq('id', requestId)
      .single();

    if (!esignReq) return;

    const { data: org } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', esignReq.organization_id)
      .single();

    if (!org) return;

    const admin = await getOrgAdmin(supabase, esignReq.organization_id);
    if (!admin) return;

    const tpl = templates.signatureCompleted({
      signerName: esignReq.signer_name ?? 'A signer',
      documentTitle: esignReq.document_title ?? 'Document',
      orgName: org.name,
    });

    await sendNotification({
      orgId: esignReq.organization_id,
      userId: admin.userId,
      eventType: 'esign.completed',
      channel: 'email',
      subject: tpl.subject,
      body: tpl.html,
      to: admin.email,
    });
  } catch (err) {
    console.error('[Triggers] notifySignatureCompleted failed:', err);
  }
}

// ---------------------------------------------------------------------------
// 5. Payment received (internal notification)
// ---------------------------------------------------------------------------

export async function notifyPaymentReceived(
  invoiceId: string,
  amount: number,
): Promise<void> {
  try {
    const supabase = await createServiceClient();

    const { data: invoice } = await supabase
      .from('invoices')
      .select('id, invoice_number, organization_id, currency')
      .eq('id', invoiceId)
      .single();

    if (!invoice) return;

    const { data: org } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', invoice.organization_id)
      .single();

    if (!org) return;

    const admin = await getOrgAdmin(supabase, invoice.organization_id);
    if (!admin) return;

    const tpl = templates.paymentReceived({
      invoiceNumber: invoice.invoice_number,
      amount: formatCurrency(amount, invoice.currency ?? 'USD'),
      orgName: org.name,
    });

    await sendNotification({
      orgId: invoice.organization_id,
      userId: admin.userId,
      eventType: 'payment.received',
      channel: 'email',
      subject: tpl.subject,
      body: tpl.html,
      to: admin.email,
    });
  } catch (err) {
    console.error('[Triggers] notifyPaymentReceived failed:', err);
  }
}

// ---------------------------------------------------------------------------
// 6. Crew booking offer
// ---------------------------------------------------------------------------

export async function notifyCrewBookingOffer(
  bookingId: string,
): Promise<void> {
  try {
    const supabase = await createServiceClient();

    const { data: booking } = await supabase
      .from('crew_bookings')
      .select('id, organization_id, proposal_id, user_id, role, shift_start')
      .eq('id', bookingId)
      .single();

    if (!booking) return;

    const [{ data: org }, { data: user }, { data: proposal }] = await Promise.all([
      supabase
        .from('organizations')
        .select('name, slug')
        .eq('id', booking.organization_id)
        .single(),
      supabase
        .from('users')
        .select('id, email, full_name')
        .eq('id', booking.user_id)
        .single(),
      supabase
        .from('proposals')
        .select('name')
        .eq('id', booking.proposal_id)
        .single(),
    ]);

    if (!org || !user?.email) return;

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    const respondUrl = `${baseUrl}/portal/${org.slug}/bookings/${bookingId}`;
    const eventName = proposal?.name ?? 'an event';
    const dateStr = formatDate(booking.shift_start?.split('T')[0] ?? booking.shift_start);

    const tpl = templates.crewBookingOffer({
      crewName: user.full_name ?? 'there',
      eventName,
      date: dateStr,
      role: booking.role,
      orgName: org.name,
      respondUrl,
    });

    await sendNotification({
      orgId: booking.organization_id,
      userId: user.id,
      eventType: 'crew.booking_offer',
      channel: 'email',
      subject: tpl.subject,
      body: tpl.html,
      to: user.email,
    });
  } catch (err) {
    console.error('[Triggers] notifyCrewBookingOffer failed:', err);
  }
}
