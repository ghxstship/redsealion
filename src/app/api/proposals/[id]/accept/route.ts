import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const body = await request.json().catch(() => ({}));
  const { signature_data, signer_name, signer_title } = body as {
    signature_data?: string;
    signer_name?: string;
    signer_title?: string;
  };

  if (!signature_data) {
    return NextResponse.json(
      { success: false, error: 'Signature data is required.' },
      { status: 400 }
    );
  }

  // Placeholder — will connect to Supabase to update proposal status to 'approved'
  return NextResponse.json({
    success: true,
    proposal_id: id,
    accepted_at: new Date().toISOString(),
    signer_name: signer_name ?? null,
    signer_title: signer_title ?? null,
    message: 'Proposal accepted successfully.',
  });
}
