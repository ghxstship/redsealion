import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/api/permission-guard';
import { generateToken } from '@/lib/utils';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const permError = await requirePermission('proposals', 'edit');
  if (permError) return permError;

  const { id } = await params;

  // Placeholder — will connect to Supabase to update proposal and send email
  const portalAccessToken = generateToken();

  return NextResponse.json({
    success: true,
    proposal_id: id,
    portal_access_token: portalAccessToken,
    message: 'Proposal sent successfully. Email delivery pending integration.',
  });
}
