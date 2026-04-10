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

import { createLogger } from '@/lib/logger';
import { castRelation } from '@/lib/supabase/cast-relation';

const log = createLogger('notification-triggers');

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
 * Resolves via organization_memberships → roles (SSOT).
 */
async function getOrgAdmin(
  supabase: Awaited<ReturnType<typeof createServiceClient>>,
  orgId: string,
): Promise<{ userId: string; email: string } | null> {
  const { data } = await supabase
    .from('organization_memberships')
    .select('user_id, roles(name)')
    .eq('organization_id', orgId)
    .eq('status', 'active')
    .order('created_at', { ascending: true })
    .limit(10);

  if (!data || data.length === 0) return null;

  // Find the first admin-level membership
  const adminEntry = data.find((m) => {
    const roleName = castRelation<{ name: string }>(m.roles)?.name;
    return roleName === 'developer' || roleName === 'owner' || roleName === 'admin';
  });

  if (!adminEntry) return null;

  const { data: userRow } = await supabase
    .from('users')
    .select('id, email')
    .eq('id', adminEntry.user_id)
    .single();

  if (!userRow) return null;
  return { userId: userRow.id as string, email: userRow.email as string };
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
    log.error('[Triggers] notifyProposalSent failed:', {}, err);
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
    log.error('[Triggers] notifyInvoiceSent failed:', {}, err);
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
    log.error('[Triggers] notifySignatureRequested failed:', {}, err);
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
    log.error('[Triggers] notifySignatureCompleted failed:', {}, err);
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
    log.error('[Triggers] notifyPaymentReceived failed:', {}, err);
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
    log.error('[Triggers] notifyCrewBookingOffer failed:', {}, err);
  }
}

// ---------------------------------------------------------------------------
// 7. Payment reminder (overdue invoice)
// ---------------------------------------------------------------------------

export async function notifyPaymentReminder(
  invoiceId: string,
): Promise<void> {
  try {
    const supabase = await createServiceClient();

    const { data: invoice } = await supabase
      .from('invoices')
      .select('id, invoice_number, total, amount_paid, due_date, currency, client_id, organization_id, payment_link')
      .eq('id', invoiceId)
      .single();

    if (!invoice || !invoice.due_date) return;

    const dueDate = new Date(invoice.due_date + 'T00:00:00');
    const now = new Date();
    const daysOverdue = Math.floor(
      (now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysOverdue <= 0) return; // Not overdue

    const amountDue = invoice.total - (invoice.amount_paid ?? 0);
    if (amountDue <= 0) return; // Already fully paid

    const [{ data: org }, { data: contact }] = await Promise.all([
      supabase
        .from('organizations')
        .select('name, slug')
        .eq('id', invoice.organization_id)
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

    const admin = await getOrgAdmin(supabase, invoice.organization_id);

    const tpl = templates.paymentReminder({
      recipientName,
      invoiceNumber: invoice.invoice_number,
      amount: formatCurrency(amountDue, invoice.currency ?? 'USD'),
      dueDate: formatDate(invoice.due_date),
      daysOverdue,
      paymentUrl,
      orgName: org.name,
    });

    await sendNotification({
      orgId: invoice.organization_id,
      userId: admin?.userId ?? invoiceId,
      eventType: 'payment.reminder',
      channel: 'email',
      subject: tpl.subject,
      body: tpl.html,
      to: contact.email,
    });
  } catch (err) {
    log.error('[Triggers] notifyPaymentReminder failed:', {}, err);
  }
}

// ---------------------------------------------------------------------------
// 8. Comment posted (internal notification to org admins)
// ---------------------------------------------------------------------------

export async function notifyCommentPosted(
  commentId: string,
  proposalId: string,
  orgId: string,
): Promise<void> {
  try {
    const supabase = await createServiceClient();

    const [{ data: comment }, { data: proposal }, { data: org }] = await Promise.all([
      supabase
        .from('proposal_comments')
        .select('id, body, author_id, is_internal')
        .eq('id', commentId)
        .single(),
      supabase
        .from('proposals')
        .select('name')
        .eq('id', proposalId)
        .single(),
      supabase
        .from('organizations')
        .select('name')
        .eq('id', orgId)
        .single(),
    ]);

    if (!comment || !proposal || !org) return;

    const { data: author } = await supabase
      .from('users')
      .select('full_name')
      .eq('id', comment.author_id)
      .single();

    const admin = await getOrgAdmin(supabase, orgId);
    if (!admin || admin.userId === comment.author_id) return; // Don't notify self

    const preview =
      comment.body.length > 100
        ? comment.body.slice(0, 100) + '…'
        : comment.body;

    await sendNotification({
      orgId,
      userId: admin.userId,
      eventType: 'comment.posted',
      channel: 'email',
      subject: `New comment on ${proposal.name}`,
      body: `${author?.full_name ?? 'Someone'} commented: "${preview}"`,
      to: admin.email,
    });
  } catch (err) {
    log.error('[Triggers] notifyCommentPosted failed:', {}, err);
  }
}

// ---------------------------------------------------------------------------
// 9. Work order dispatched (crew notification)
// ---------------------------------------------------------------------------

export async function notifyWorkOrderDispatched(
  workOrderId: string,
  orgId: string,
): Promise<void> {
  try {
    const supabase = await createServiceClient();

    const { data: wo } = await supabase
      .from('work_orders')
      .select('id, wo_number, title, location_name, scheduled_start')
      .eq('id', workOrderId)
      .single();

    if (!wo) return;

    const { data: org } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', orgId)
      .single();

    if (!org) return;

    // Find all assigned crew members
    const { data: assignments } = await supabase
      .from('work_order_assignments')
      .select('crew_profile_id, crew_profiles(user_id)')
      .eq('work_order_id', workOrderId);

    if (!assignments || assignments.length === 0) return;

    for (const assignment of assignments) {
      const crewProfile = castRelation<{ user_id: string }>(assignment.crew_profiles);
      if (!crewProfile?.user_id) continue;

      const { data: user } = await supabase
        .from('users')
        .select('id, email, full_name')
        .eq('id', crewProfile.user_id)
        .single();

      if (!user?.email) continue;

      const scheduledDate = wo.scheduled_start
        ? new Date(wo.scheduled_start).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })
        : '';

      const tpl = templates.workOrderDispatched({
        crewName: user.full_name ?? 'there',
        woNumber: wo.wo_number,
        title: wo.title,
        location: wo.location_name ?? '',
        scheduledDate,
        orgName: org.name,
      });

      await sendNotification({
        orgId,
        userId: user.id,
        eventType: 'work_order.dispatched',
        channel: 'email',
        subject: tpl.subject,
        body: tpl.html,
        to: user.email,
      });
    }
  } catch (err) {
    log.error('[Triggers] notifyWorkOrderDispatched failed:', {}, err);
  }
}

// ---------------------------------------------------------------------------
// 10. Lead received (internal notification to org admins)
// ---------------------------------------------------------------------------

export async function notifyLeadReceived(
  leadId: string,
  orgId: string,
): Promise<void> {
  try {
    const supabase = await createServiceClient();

    const [{ data: lead }, { data: org }] = await Promise.all([
      supabase
        .from('leads')
        .select('id, contact_first_name, contact_last_name, event_type')
        .eq('id', leadId)
        .single(),
      supabase
        .from('organizations')
        .select('name')
        .eq('id', orgId)
        .single(),
    ]);

    if (!lead || !org) return;

    const admin = await getOrgAdmin(supabase, orgId);
    if (!admin) return;

    const leadName = [lead.contact_first_name, lead.contact_last_name].filter(Boolean).join(' ') || 'A new prospect';
    const eventName = lead.event_type || 'an upcoming event';

    const tpl = templates.leadReceived({
      leadName,
      eventName,
      orgName: org.name,
    });

    await sendNotification({
      orgId,
      userId: admin.userId,
      eventType: 'lead.received', // We can use this as eventType, it doesn't have to exist in a strictly-typed enum unless required (I'll assume it's string)
      channel: 'email',
      subject: tpl.subject,
      body: tpl.html,
      to: admin.email,
    });
  } catch (err) {
    log.error('[Triggers] notifyLeadReceived failed:', {}, err);
  }
}

// ---------------------------------------------------------------------------
// 11. Bid submitted (internal notification to org admin)
// ---------------------------------------------------------------------------

export async function notifyBidSubmitted(
  workOrderId: string,
  orgId: string,
  bidAmount: number,
): Promise<void> {
  try {
    const supabase = await createServiceClient();

    const [{ data: wo }, { data: org }] = await Promise.all([
      supabase
        .from('work_orders')
        .select('wo_number, title')
        .eq('id', workOrderId)
        .single(),
      supabase
        .from('organizations')
        .select('name')
        .eq('id', orgId)
        .single(),
    ]);

    if (!wo || !org) return;

    const admin = await getOrgAdmin(supabase, orgId);
    if (!admin) return;

    const amountStr = formatCurrency(bidAmount);

    await sendNotification({
      orgId,
      userId: admin.userId,
      eventType: 'bid.submitted',
      channel: 'email',
      subject: `New bid on ${wo.wo_number}: ${wo.title}`,
      body: `A new bid of ${amountStr} has been submitted on work order ${wo.wo_number} (${wo.title}). Review the bid in the Dispatch panel.`,
      to: admin.email,
    });
  } catch (err) {
    log.error('[Triggers] notifyBidSubmitted failed:', {}, err);
  }
}

// ---------------------------------------------------------------------------
// 12. Bid resolved — accepted, rejected, or withdrawn (crew notification)
// ---------------------------------------------------------------------------

export async function notifyBidResolved(
  bidId: string,
  workOrderId: string,
  orgId: string,
  status: 'accepted' | 'rejected' | 'withdrawn',
): Promise<void> {
  try {
    // Don't notify on withdrawal — the user initiated it themselves
    if (status === 'withdrawn') return;

    const supabase = await createServiceClient();

    const [{ data: bid }, { data: wo }, { data: org }] = await Promise.all([
      supabase
        .from('work_order_bids')
        .select('crew_profile_id, proposed_amount, crew_profiles(user_id)')
        .eq('id', bidId)
        .single(),
      supabase
        .from('work_orders')
        .select('wo_number, title')
        .eq('id', workOrderId)
        .single(),
      supabase
        .from('organizations')
        .select('name')
        .eq('id', orgId)
        .single(),
    ]);

    if (!bid || !wo || !org) return;

    const crewProfile = castRelation<{ user_id: string }>(bid.crew_profiles);
    if (!crewProfile?.user_id) return;

    const { data: user } = await supabase
      .from('users')
      .select('id, email, full_name')
      .eq('id', crewProfile.user_id)
      .single();

    if (!user?.email) return;

    const statusLabel = status === 'accepted' ? 'accepted' : 'not selected';
    const amountStr = formatCurrency(bid.proposed_amount);

    await sendNotification({
      orgId,
      userId: user.id,
      eventType: `bid.${status}`,
      channel: 'email',
      subject: `Your bid on ${wo.wo_number} has been ${statusLabel}`,
      body: `Your bid of ${amountStr} on work order ${wo.wo_number} (${wo.title}) has been ${statusLabel} by ${org.name}.${status === 'accepted' ? ' You will receive assignment details shortly.' : ''}`,
      to: user.email,
    });
  } catch (err) {
    log.error('[Triggers] notifyBidResolved failed:', {}, err);
  }
}

