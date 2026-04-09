import { NextRequest, NextResponse } from 'next/server';
import { transitionAdvanceStatus } from '../workflow';

/**
 * POST /api/advances/[id]/hold — Transition to on_hold
 *
 * Gap: H-10 — AdvanceDetailClient had no mapping for on_hold transition
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  return transitionAdvanceStatus(id, 'on_hold' as never, { reason: (body as Record<string, unknown>).reason as string });
}
