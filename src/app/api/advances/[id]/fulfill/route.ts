import { NextRequest, NextResponse } from 'next/server';
import { transitionAdvanceStatus } from '../workflow';

/**
 * POST /api/advances/[id]/fulfill — Transition through fulfillment stages
 *   body.target: 'partially_fulfilled' | 'fulfilled' | 'completed'
 *
 * Gap: H-11 — No post-approval workflow transitions existed
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  const target = (body as Record<string, unknown>).target as string;
  const validTargets = ['partially_fulfilled', 'fulfilled', 'completed'];
  if (!target || !validTargets.includes(target)) {
    return NextResponse.json(
      { error: `target must be one of: ${validTargets.join(', ')}` },
      { status: 422 },
    );
  }

  return transitionAdvanceStatus(id, target as never, { reason: (body as Record<string, unknown>).reason as string });
}
