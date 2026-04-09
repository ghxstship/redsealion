import { NextRequest, NextResponse } from 'next/server';
import { transitionAdvanceStatus } from '../workflow';

/**
 * POST /api/advances/[id]/resume — Transition from on_hold back to under_review
 *
 * Gap: H-04 — Users could put an advance on hold but had no API to resume it
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  return transitionAdvanceStatus(id, 'under_review' as never, { reason: (body as Record<string, unknown>).reason as string });
}
