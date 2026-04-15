/**
 * DEPRECATED: Proposal DOCX export
 *
 * This legacy route redirects to the canonical document engine.
 * All document generation now flows through /api/documents/[type].
 */

import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const url = new URL(request.url);
  const canonicalUrl = new URL(`/api/documents/proposal`, url.origin);
  canonicalUrl.searchParams.set('proposalId', id);

  return NextResponse.redirect(canonicalUrl.toString(), 307);
}
