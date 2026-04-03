import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { evaluateAllFlags } from '@/lib/harbor-master/feature-flags';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const orgId = url.searchParams.get('organization_id');

  const flags = await evaluateAllFlags(orgId, user.id);

  return NextResponse.json({ flags });
}
