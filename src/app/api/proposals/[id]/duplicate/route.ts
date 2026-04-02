import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/api/permission-guard';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const permError = await requirePermission('proposals', 'create');
  if (permError) return permError;

  const { id } = await params;

  // Placeholder — will connect to Supabase to deep-clone proposal and relations
  const newProposalId = `proposal-${Date.now()}`;

  return NextResponse.json({
    success: true,
    source_proposal_id: id,
    new_proposal_id: newProposalId,
    message: 'Proposal duplicated successfully.',
  });
}
