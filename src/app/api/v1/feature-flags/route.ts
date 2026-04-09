import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth-guard';
import { evaluateAllFlags } from '@/lib/harbor-master/feature-flags';

export async function GET(request: NextRequest) {
  const { ctx, denied } = await requireAuth();
  if (denied) return denied;

  const url = new URL(request.url);
  const orgId = url.searchParams.get('organization_id') ?? ctx.organizationId;

  try {
    const flags = await evaluateAllFlags(orgId, ctx.userId);
    return NextResponse.json({ flags });
  } catch {
    return NextResponse.json({ error: 'Failed to evaluate feature flags' }, { status: 500 });
  }
}
