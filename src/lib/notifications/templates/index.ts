/**
 * FlyteDeck notification templates.
 *
 * Each function returns { subject, html, smsText? } ready for the dispatcher.
 */

import {
  wrapEmailHtml,
  ctaButton,
  heading,
  paragraph,
  detailRow,
  detailTable,
} from './base';

interface TemplateResult {
  subject: string;
  html: string;
  smsText?: string;
}

// ---------------------------------------------------------------------------
// a) Proposal sent
// ---------------------------------------------------------------------------

export function proposalSent(data: {
  recipientName: string;
  proposalTitle: string;
  clientPortalUrl: string;
  orgName: string;
  senderName: string;
}): TemplateResult {
  const content = [
    heading('Your proposal is ready'),
    paragraph(
      `Hi ${data.recipientName},`,
    ),
    paragraph(
      `${data.senderName} from ${data.orgName} has shared a proposal with you: <strong>${data.proposalTitle}</strong>.`,
    ),
    paragraph('Click below to review the details and respond.'),
    ctaButton('View Proposal', data.clientPortalUrl),
  ].join('\n');

  return {
    subject: `Proposal: ${data.proposalTitle}`,
    html: wrapEmailHtml(content, data.orgName),
    smsText: `${data.orgName}: Your proposal "${data.proposalTitle}" is ready. View it here: ${data.clientPortalUrl}`,
  };
}

// ---------------------------------------------------------------------------
// b) Invoice sent
// ---------------------------------------------------------------------------

export function invoiceSent(data: {
  recipientName: string;
  invoiceNumber: string;
  amount: string;
  dueDate: string;
  paymentUrl: string;
  orgName: string;
}): TemplateResult {
  const details = detailTable(
    [
      detailRow('Invoice', data.invoiceNumber),
      detailRow('Amount Due', data.amount),
      detailRow('Due Date', data.dueDate),
    ].join('\n'),
  );

  const content = [
    heading(`Invoice ${data.invoiceNumber} is ready`),
    paragraph(`Hi ${data.recipientName},`),
    paragraph(
      `${data.orgName} has sent you an invoice. Please review the details below and submit payment by ${data.dueDate}.`,
    ),
    details,
    ctaButton('Pay Now', data.paymentUrl),
  ].join('\n');

  return {
    subject: `Invoice ${data.invoiceNumber} — ${data.amount} due ${data.dueDate}`,
    html: wrapEmailHtml(content, data.orgName),
    smsText: `${data.orgName}: Invoice ${data.invoiceNumber} for ${data.amount} is due ${data.dueDate}. Pay now: ${data.paymentUrl}`,
  };
}

// ---------------------------------------------------------------------------
// c) Signature requested
// ---------------------------------------------------------------------------

export function signatureRequested(data: {
  recipientName: string;
  documentTitle: string;
  signUrl: string;
  orgName: string;
  senderName: string;
}): TemplateResult {
  const content = [
    heading(`Please sign: ${data.documentTitle}`),
    paragraph(`Hi ${data.recipientName},`),
    paragraph(
      `${data.senderName} from ${data.orgName} has requested your signature on <strong>${data.documentTitle}</strong>.`,
    ),
    paragraph('Click below to review the document and sign electronically.'),
    ctaButton('Review &amp; Sign', data.signUrl),
  ].join('\n');

  return {
    subject: `Signature requested: ${data.documentTitle}`,
    html: wrapEmailHtml(content, data.orgName),
    smsText: `${data.orgName}: Please sign "${data.documentTitle}". ${data.signUrl}`,
  };
}

// ---------------------------------------------------------------------------
// d) Signature completed (internal)
// ---------------------------------------------------------------------------

export function signatureCompleted(data: {
  signerName: string;
  documentTitle: string;
  orgName: string;
}): TemplateResult {
  const content = [
    heading('Document signed'),
    paragraph(
      `<strong>${data.signerName}</strong> has signed <strong>${data.documentTitle}</strong>.`,
    ),
    paragraph('The signed document is available in your FlyteDeck dashboard.'),
  ].join('\n');

  return {
    subject: `Signed: ${data.signerName} signed ${data.documentTitle}`,
    html: wrapEmailHtml(content, data.orgName),
  };
}

// ---------------------------------------------------------------------------
// e) Payment received (internal)
// ---------------------------------------------------------------------------

export function paymentReceived(data: {
  invoiceNumber: string;
  amount: string;
  orgName: string;
}): TemplateResult {
  const content = [
    heading('Payment received'),
    paragraph(
      `A payment of <strong>${data.amount}</strong> has been received for <strong>Invoice ${data.invoiceNumber}</strong>.`,
    ),
    paragraph('The invoice has been updated in your FlyteDeck dashboard.'),
  ].join('\n');

  return {
    subject: `Payment received: ${data.amount} for Invoice ${data.invoiceNumber}`,
    html: wrapEmailHtml(content, data.orgName),
  };
}

// ---------------------------------------------------------------------------
// f) Crew booking offer
// ---------------------------------------------------------------------------

export function crewBookingOffer(data: {
  crewName: string;
  eventName: string;
  date: string;
  role: string;
  orgName: string;
  respondUrl: string;
}): TemplateResult {
  const details = detailTable(
    [
      detailRow('Event', data.eventName),
      detailRow('Date', data.date),
      detailRow('Role', data.role),
    ].join('\n'),
  );

  const content = [
    heading("You've been offered a booking"),
    paragraph(`Hi ${data.crewName},`),
    paragraph(
      `${data.orgName} would like to book you for an upcoming event. Here are the details:`,
    ),
    details,
    ctaButton('Respond to Offer', data.respondUrl),
  ].join('\n');

  return {
    subject: `Booking offer: ${data.role} for ${data.eventName}`,
    html: wrapEmailHtml(content, data.orgName),
    smsText: `${data.orgName}: Booking offer for ${data.eventName} on ${data.date} as ${data.role}. Respond: ${data.respondUrl}`,
  };
}

// ---------------------------------------------------------------------------
// g) Crew booking confirmed
// ---------------------------------------------------------------------------

function crewBookingConfirmed(data: {
  crewName: string;
  eventName: string;
  date: string;
  role: string;
  orgName: string;
}): TemplateResult {
  const details = detailTable(
    [
      detailRow('Event', data.eventName),
      detailRow('Date', data.date),
      detailRow('Role', data.role),
    ].join('\n'),
  );

  const content = [
    heading('Your booking is confirmed'),
    paragraph(`Hi ${data.crewName},`),
    paragraph(
      `Your booking with ${data.orgName} has been confirmed. See you there!`,
    ),
    details,
  ].join('\n');

  return {
    subject: `Booking confirmed: ${data.role} for ${data.eventName}`,
    html: wrapEmailHtml(content, data.orgName),
    smsText: `${data.orgName}: Confirmed! ${data.role} for ${data.eventName} on ${data.date}.`,
  };
}

// ---------------------------------------------------------------------------
// h) Equipment reservation alert (internal)
// ---------------------------------------------------------------------------

function equipmentReservationAlert(data: {
  assetName: string;
  eventName: string;
  dates: string;
  orgName: string;
}): TemplateResult {
  const details = detailTable(
    [
      detailRow('Equipment', data.assetName),
      detailRow('Event', data.eventName),
      detailRow('Dates', data.dates),
    ].join('\n'),
  );

  const content = [
    heading('Equipment reserved'),
    paragraph(
      `<strong>${data.assetName}</strong> has been reserved for <strong>${data.eventName}</strong>.`,
    ),
    details,
  ].join('\n');

  return {
    subject: `Equipment reserved: ${data.assetName} for ${data.eventName}`,
    html: wrapEmailHtml(content, data.orgName),
  };
}

// ---------------------------------------------------------------------------
// i) Payment reminder (overdue invoice)
// ---------------------------------------------------------------------------

export function paymentReminder(data: {
  recipientName: string;
  invoiceNumber: string;
  amount: string;
  dueDate: string;
  daysOverdue: number;
  paymentUrl: string;
  orgName: string;
}): TemplateResult {
  const urgencyLabel =
    data.daysOverdue <= 7
      ? 'a friendly reminder'
      : data.daysOverdue <= 14
        ? 'a second reminder'
        : 'an urgent reminder';

  const details = detailTable(
    [
      detailRow('Invoice', data.invoiceNumber),
      detailRow('Amount Due', data.amount),
      detailRow('Due Date', data.dueDate),
      detailRow('Days Overdue', String(data.daysOverdue)),
    ].join('\n'),
  );

  const content = [
    heading('Payment Reminder'),
    paragraph(`Hi ${data.recipientName},`),
    paragraph(
      `This is ${urgencyLabel} that <strong>Invoice ${data.invoiceNumber}</strong> for <strong>${data.amount}</strong> was due on <strong>${data.dueDate}</strong> and is now <strong>${data.daysOverdue} day${data.daysOverdue === 1 ? '' : 's'} overdue</strong>.`,
    ),
    details,
    ctaButton('Pay Now', data.paymentUrl),
    paragraph(
      'If you have already sent payment, please disregard this reminder. If you have any questions, please don\'t hesitate to reach out.',
    ),
  ].join('\n');

  return {
    subject: `Payment reminder: Invoice ${data.invoiceNumber} — ${data.amount} overdue`,
    html: wrapEmailHtml(content, data.orgName),
    smsText: `${data.orgName}: Reminder — Invoice ${data.invoiceNumber} for ${data.amount} is ${data.daysOverdue} days overdue. Pay: ${data.paymentUrl}`,
  };
}

// ---------------------------------------------------------------------------
// j) Work order dispatched (crew notification)
// ---------------------------------------------------------------------------

export function workOrderDispatched(data: {
  crewName: string;
  woNumber: string;
  title: string;
  location: string;
  scheduledDate: string;
  orgName: string;
}): TemplateResult {
  const details = detailTable(
    [
      detailRow('Work Order', `${data.woNumber} — ${data.title}`),
      detailRow('Location', data.location || 'TBD'),
      detailRow('Scheduled', data.scheduledDate || 'TBD'),
    ].join('\n'),
  );

  const content = [
    heading('You\'ve been dispatched'),
    paragraph(`Hi ${data.crewName},`),
    paragraph(
      `${data.orgName} has dispatched you to a work order. Please review the details below.`,
    ),
    details,
  ].join('\n');

  return {
    subject: `Dispatched: ${data.woNumber} — ${data.title}`,
    html: wrapEmailHtml(content, data.orgName),
    smsText: `${data.orgName}: You've been dispatched to ${data.woNumber} — ${data.title} at ${data.location || 'TBD'}`,
  };
}

// ---------------------------------------------------------------------------
// k) Lead received (internal notification to org admins)
// ---------------------------------------------------------------------------

export function leadReceived(data: {
  leadName: string;
  eventName: string;
  orgName: string;
}): TemplateResult {
  const content = [
    heading('New lead received'),
    paragraph(
      `<strong>${data.leadName}</strong> has submitted an intake form for <strong>${data.eventName}</strong>.`,
    ),
    paragraph('You can view the full details in your FlyteDeck dashboard.'),
  ].join('\n');

  return {
    subject: `New Lead: ${data.leadName} - ${data.eventName}`,
    html: wrapEmailHtml(content, data.orgName),
  };
}
