import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/api/permission-guard';
import { castRelation } from '@/lib/supabase/cast-relation';
import { castPaymentTerms } from '@/lib/documents/json-casts';
import type { Json } from '@/types/database';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const permError = await requirePermission('proposals', 'view');
  if (permError) return permError;

  const { id } = await params;

  let proposalName = 'Proposal';
  let clientName = 'Client';
  let subtitle = '';
  let totalValue = 0;
  let status = 'draft';
  let preparedDate = '';
  let validUntil = '';
  let paymentTerms = '50/50';
  let phases: Array<{
    phase_number: string;
    name: string;
    status: string;
    phase_investment: number;
  }> = [];

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error('No auth');

    const { data: proposal } = await supabase
      .from('proposals')
      .select('*, clients(company_name)')
      .eq('id', id)
      .single();

    if (!proposal) throw new Error('Not found');

    proposalName = proposal.name;
    clientName =
      castRelation<Record<string, string>>(proposal.clients)?.company_name ?? 'Client';
    subtitle = proposal.subtitle ?? '';
    totalValue = proposal.total_value;
    status = proposal.status;
    preparedDate = proposal.prepared_date ?? '';
    validUntil = proposal.valid_until ?? '';
    paymentTerms =
      castPaymentTerms(proposal.payment_terms as Json)?.structure ?? '50/50';

    const { data: phaseData } = await supabase
      .from('phases')
      .select('phase_number, name, status, phase_investment')
      .eq('proposal_id', id)
      .order('sort_order');

    phases = (phaseData ?? []) as typeof phases;
  } catch (error) {
    const { createLogger } = await import('@/lib/logger');
    createLogger('proposals').error('PDF export failed', { proposalId: id }, error);
    return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
  }

  const currencyFmt = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  const formatDate = (iso: string): string => {
    if (!iso) return 'N/A';
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const statusLabel = status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  const phaseStatusLabel = (s: string) =>
    s
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());

  const phaseRows = phases
    .map(
      (p) => `
        <tr>
          <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; color: #64748b; text-align: center;">${p.phase_number}</td>
          <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-weight: 500;">${p.name}</td>
          <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; text-align: center;">
            <span style="display: inline-block; padding: 2px 10px; border-radius: 9999px; font-size: 12px; font-weight: 500; background: ${
              p.status === 'complete'
                ? '#dcfce7; color: #166534'
                : p.status === 'in_progress'
                  ? '#dbeafe; color: #1e40af'
                  : '#f1f5f9; color: #475569'
            };">${phaseStatusLabel(p.status)}</span>
          </td>
          <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; text-align: right; font-variant-numeric: tabular-nums;">${currencyFmt.format(p.phase_investment)}</td>
        </tr>`
    )
    .join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${proposalName} - Proposal</title>
  <style>
    @media print {
      body { margin: 0; }
      .page-break { page-break-before: always; }
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      color: #1e293b;
      line-height: 1.6;
      background: #ffffff;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 48px 40px;
    }
    .header {
      border-bottom: 3px solid #0f172a;
      padding-bottom: 32px;
      margin-bottom: 32px;
    }
    .company-badge {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: #64748b;
      margin-bottom: 12px;
    }
    h1 {
      font-size: 28px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 6px;
    }
    .subtitle {
      font-size: 16px;
      color: #475569;
      font-weight: 400;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 36px;
    }
    .meta-card {
      background: #f8fafc;
      border-radius: 8px;
      padding: 16px 20px;
    }
    .meta-label {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      color: #94a3b8;
      margin-bottom: 4px;
    }
    .meta-value {
      font-size: 15px;
      font-weight: 500;
      color: #1e293b;
    }
    h2 {
      font-size: 18px;
      font-weight: 600;
      color: #0f172a;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e2e8f0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 32px;
    }
    th {
      padding: 10px 14px;
      text-align: left;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      color: #64748b;
      background: #f8fafc;
      border-bottom: 2px solid #e2e8f0;
    }
    th:first-child { text-align: center; }
    th:nth-child(3) { text-align: center; }
    th:last-child { text-align: right; }
    .total-row {
      background: #0f172a;
      color: #ffffff;
      padding: 16px 20px;
      border-radius: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 32px;
    }
    .total-label {
      font-size: 14px;
      font-weight: 500;
    }
    .total-value {
      font-size: 24px;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
    }
    .payment-terms {
      background: #f8fafc;
      border-radius: 8px;
      padding: 20px 24px;
      margin-bottom: 32px;
    }
    .payment-terms p {
      font-size: 14px;
      color: #475569;
      margin-bottom: 4px;
    }
    .footer {
      margin-top: 48px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      font-size: 12px;
      color: #94a3b8;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="company-badge">Proposal Document</div>
      <h1>${proposalName}</h1>
      ${subtitle ? `<p class="subtitle">${subtitle}</p>` : ''}
    </div>

    <div class="meta-grid">
      <div class="meta-card">
        <div class="meta-label">Client</div>
        <div class="meta-value">${clientName}</div>
      </div>
      <div class="meta-card">
        <div class="meta-label">Status</div>
        <div class="meta-value">${statusLabel}</div>
      </div>
      <div class="meta-card">
        <div class="meta-label">Prepared Date</div>
        <div class="meta-value">${formatDate(preparedDate)}</div>
      </div>
      <div class="meta-card">
        <div class="meta-label">Valid Until</div>
        <div class="meta-value">${formatDate(validUntil)}</div>
      </div>
    </div>

    <h2>Phase Breakdown</h2>
    <table>
      <thead>
        <tr>
          <th>Phase</th>
          <th>Name</th>
          <th>Status</th>
          <th>Investment</th>
        </tr>
      </thead>
      <tbody>
        ${phaseRows}
      </tbody>
    </table>

    <div class="total-row">
      <span class="total-label">Total Investment</span>
      <span class="total-value">${currencyFmt.format(totalValue)}</span>
    </div>

    <h2>Payment Terms</h2>
    <div class="payment-terms">
      <p><strong>Payment Structure:</strong> ${paymentTerms}</p>
      <p>Detailed payment milestones and terms are outlined in the accompanying agreement.</p>
    </div>

    <div class="footer">
      <p>Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} &mdash; Print this page to save as PDF</p>
    </div>
  </div>
</body>
</html>`;

  const filename = `${proposalName.replace(/[^a-zA-Z0-9]/g, '_')}_Proposal.html`;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
