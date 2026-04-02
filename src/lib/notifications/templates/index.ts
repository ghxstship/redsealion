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

export interface TemplateResult {
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

export function crewBookingConfirmed(data: {
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

export function equipmentReservationAlert(data: {
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
