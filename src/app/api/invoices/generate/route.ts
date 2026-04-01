import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { proposal_id } = body as { proposal_id?: string };

  if (!proposal_id) {
    return NextResponse.json(
      { success: false, error: 'proposal_id is required.' },
      { status: 400 }
    );
  }

  // Placeholder — will connect to Supabase to generate invoices from proposal payment terms
  const invoices = [
    {
      id: `inv-${Date.now()}-1`,
      invoice_number: 'INV-2026-DRAFT-001',
      type: 'deposit',
      status: 'draft',
      subtotal: 127500,
      tax_amount: 0,
      total: 127500,
      due_date: new Date(Date.now() + 14 * 86400000).toISOString(),
    },
    {
      id: `inv-${Date.now()}-2`,
      invoice_number: 'INV-2026-DRAFT-002',
      type: 'balance',
      status: 'draft',
      subtotal: 382500,
      tax_amount: 0,
      total: 382500,
      due_date: new Date(Date.now() + 90 * 86400000).toISOString(),
    },
  ];

  return NextResponse.json({
    success: true,
    proposal_id,
    invoices,
    message: `Generated ${invoices.length} draft invoices.`,
  });
}
