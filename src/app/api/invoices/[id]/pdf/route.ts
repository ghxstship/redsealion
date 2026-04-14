import { NextRequest, NextResponse } from 'next/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { createClient } from '@/lib/supabase/server';
import { formatCurrency } from '@/lib/utils';

/**
 * Generate a downloadable HTML-based invoice document.
 * This uses server-rendered HTML converted to a downloadable format.
 * For production PDF, this can be enhanced with @react-pdf/renderer or Puppeteer.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const perm = await checkPermission('invoices', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const supabase = await createClient();

  // Fetch invoice with line items and client info
  const { data: invoice, error } = await supabase
    .from('invoices')
    .select('*, clients(company_name, billing_address), invoice_line_items(*)')
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .single();

  if (error || !invoice) {
    return NextResponse.json({ error: 'Invoice not found.' }, { status: 404 });
  }

  // Fetch organization info for branding
  const { data: org } = await supabase
    .from('organizations')
    .select('name, logo_url, settings, tax_label')
    .eq('id', perm.organizationId)
    .single();

  const orgName = org?.name ?? 'FlyteDeck';
  const taxLabel = (org?.tax_label as string) ?? 'Tax';
  const logoUrl = org?.logo_url as string | null;

  const client = invoice.clients as Record<string, unknown> | null;
  const clientName = (client?.company_name as string) ?? 'Client';
  const billingAddress = client?.billing_address as Record<string, string> | null;

  const lineItems = (invoice.invoice_line_items as Array<Record<string, unknown>>) ?? [];

  // Build the PDF-ready HTML
  const html = buildInvoiceHTML({
    orgName,
    logoUrl,
    taxLabel,
    invoiceNumber: invoice.invoice_number as string,
    type: invoice.type as string,
    status: invoice.status as string,
    issueDate: invoice.issue_date as string,
    dueDate: invoice.due_date as string,
    clientName,
    billingAddress,
    lineItems: lineItems.map((li) => ({
      description: li.description as string,
      quantity: li.quantity as number,
      rate: li.rate as number,
      amount: li.amount as number,
      taxRate: (li.tax_rate as number) ?? 0,
      taxAmount: (li.tax_amount as number) ?? 0,
    })),
    subtotal: invoice.subtotal as number,
    taxAmount: invoice.tax_amount as number,
    total: invoice.total as number,
    amountPaid: invoice.amount_paid as number,
    currency: (invoice.currency as string) ?? 'USD',
    memo: invoice.memo as string | null,
  });

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `inline; filename="${invoice.invoice_number}.html"`,
    },
  });
}

interface InvoiceData {
  orgName: string;
  logoUrl: string | null;
  taxLabel: string;
  invoiceNumber: string;
  type: string;
  status: string;
  issueDate: string;
  dueDate: string;
  clientName: string;
  billingAddress: Record<string, string> | null;
  lineItems: Array<{
    description: string;
    quantity: number;
    rate: number;
    amount: number;
    taxRate: number;
    taxAmount: number;
  }>;
  subtotal: number;
  taxAmount: number;
  total: number;
  amountPaid: number;
  currency: string;
  memo: string | null;
}

function fmtCurrency(amount: number): string {
  return formatCurrency(amount);
}

function fmtDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function buildInvoiceHTML(data: InvoiceData): string {
  const hasTax = data.taxAmount > 0;
  const balanceDue = data.total - data.amountPaid;
  const addressLines = data.billingAddress
    ? [
        data.billingAddress.street,
        data.billingAddress.city,
        [data.billingAddress.state, data.billingAddress.zip].filter(Boolean).join(' '),
        data.billingAddress.country,
      ].filter(Boolean)
    : [];

  const lineItemRows = data.lineItems
    .map(
      (li) => `
      <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 14px; color: #111827;">${li.description}</td>
        <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; text-align: right;">${li.quantity}</td>
        <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; text-align: right;">${fmtCurrency(li.rate)}</td>
        ${hasTax ? `<td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; text-align: right;">${li.taxRate > 0 ? `${li.taxRate}%` : '—'}</td>` : ''}
        <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 14px; color: #111827; text-align: right; font-weight: 500;">${fmtCurrency(li.amount + li.taxAmount)}</td>
      </tr>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${data.invoiceNumber}</title>
  <style>
    @media print {
      body { margin: 0; padding: 0; }
      .no-print { display: none !important; }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      padding: 40px;
      background: #ffffff;
      color: #111827;
    }
    @page { margin: 40px; }
  </style>
</head>
<body>
  <!-- Print Button -->
  <div class="no-print" style="text-align: right; margin-bottom: 24px;">
    <button onclick="window.print()" style="padding: 8px 20px; background: #111827; color: #fff; border: none; border-radius: 8px; font-size: 14px; cursor: pointer;">
      Print / Save PDF
    </button>
  </div>

  <!-- Header -->
  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 48px;">
    <div>
      ${data.logoUrl ? `<img src="${data.logoUrl}" alt="${data.orgName}" style="height: 40px; margin-bottom: 12px;" />` : ''}
      <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #111827;">${data.orgName}</h1>
    </div>
    <div style="text-align: right;">
      <p style="margin: 0; font-size: 32px; font-weight: 700; color: #111827; letter-spacing: -0.5px;">INVOICE</p>
      <p style="margin: 4px 0 0; font-size: 14px; color: #6b7280;">${data.invoiceNumber}</p>
      <div style="margin-top: 8px; display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; text-transform: uppercase;
        background: ${data.status === 'paid' ? '#ecfdf5' : data.status === 'sent' ? '#eff6ff' : '#f3f4f6'};
        color: ${data.status === 'paid' ? '#059669' : data.status === 'sent' ? '#2563eb' : '#6b7280'};">
        ${data.status}
      </div>
    </div>
  </div>

  <!-- Dates & Client -->
  <div style="display: flex; justify-content: space-between; margin-bottom: 40px;">
    <div>
      <p style="margin: 0 0 4px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #9ca3af;">Bill To</p>
      <p style="margin: 0; font-size: 16px; font-weight: 600; color: #111827;">${data.clientName}</p>
      ${addressLines.map((line) => `<p style="margin: 2px 0; font-size: 14px; color: #6b7280;">${line}</p>`).join('')}
    </div>
    <div style="text-align: right;">
      <div style="margin-bottom: 12px;">
        <p style="margin: 0 0 2px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #9ca3af;">Issue Date</p>
        <p style="margin: 0; font-size: 14px; color: #111827;">${fmtDate(data.issueDate)}</p>
      </div>
      <div>
        <p style="margin: 0 0 2px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #9ca3af;">Due Date</p>
        <p style="margin: 0; font-size: 14px; color: #111827; font-weight: 600;">${fmtDate(data.dueDate)}</p>
      </div>
    </div>
  </div>

  <!-- Line Items -->
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 32px;">
    <thead>
      <tr style="background: #f9fafb;">
        <th style="padding: 10px 16px; text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #9ca3af; border-bottom: 2px solid #e5e7eb;">Description</th>
        <th style="padding: 10px 16px; text-align: right; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #9ca3af; border-bottom: 2px solid #e5e7eb;">Qty</th>
        <th style="padding: 10px 16px; text-align: right; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #9ca3af; border-bottom: 2px solid #e5e7eb;">Rate</th>
        ${hasTax ? `<th style="padding: 10px 16px; text-align: right; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #9ca3af; border-bottom: 2px solid #e5e7eb;">${data.taxLabel}</th>` : ''}
        <th style="padding: 10px 16px; text-align: right; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #9ca3af; border-bottom: 2px solid #e5e7eb;">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${lineItemRows}
    </tbody>
  </table>

  <!-- Totals -->
  <div style="display: flex; justify-content: flex-end;">
    <div style="width: 280px;">
      <div style="display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px;">
        <span style="color: #6b7280;">Subtotal</span>
        <span style="color: #111827;">${fmtCurrency(data.subtotal)}</span>
      </div>
      ${
        hasTax
          ? `<div style="display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px;">
              <span style="color: #6b7280;">${data.taxLabel}</span>
              <span style="color: #111827;">${fmtCurrency(data.taxAmount)}</span>
            </div>`
          : ''
      }
      <div style="display: flex; justify-content: space-between; padding: 12px 0; font-size: 18px; font-weight: 700; border-top: 2px solid #111827; margin-top: 8px;">
        <span>Total</span>
        <span>${fmtCurrency(data.total)}</span>
      </div>
      ${
        data.amountPaid > 0
          ? `<div style="display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px;">
              <span style="color: #059669;">Amount Paid</span>
              <span style="color: #059669;">−${fmtCurrency(data.amountPaid)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0; font-size: 16px; font-weight: 600;">
              <span style="color: #111827;">Balance Due</span>
              <span style="color: #111827;">${fmtCurrency(balanceDue)}</span>
            </div>`
          : ''
      }
    </div>
  </div>

  ${
    data.memo
      ? `<div style="margin-top: 40px; padding: 16px 20px; background: #f9fafb; border-radius: 8px;">
          <p style="margin: 0 0 4px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #9ca3af;">Notes</p>
          <p style="margin: 0; font-size: 14px; color: #6b7280; line-height: 1.6;">${data.memo}</p>
        </div>`
      : ''
  }
</body>
</html>`;
}
