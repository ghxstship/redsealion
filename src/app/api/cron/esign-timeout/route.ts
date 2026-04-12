import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireWebhookSecret } from '@/lib/api/auth-guard';

export async function POST(request: Request) {
  // CRON endpoint protected by a secret token
  const authErr = requireWebhookSecret(request, 'CRON_SECRET', { useBearerPrefix: true });
  if (authErr) return authErr;

  const supabase = await createClient();

  // Find requests stuck in 'in_progress' for more than 72 hours
  const staleTime = new Date();
  staleTime.setHours(staleTime.getHours() - 72);

  const { data: staleSignatures, error: fetchErr } = await supabase
    .from('esignature_requests')
    .select('id, proposal_id')
    .eq('status', 'in_progress')
    .lte('created_at', staleTime.toISOString());

  if (fetchErr) {
    return NextResponse.json({ error: 'Failed to fetch stale requests', details: fetchErr.message }, { status: 500 });
  }

  if (!staleSignatures || staleSignatures.length === 0) {
    return NextResponse.json({ success: true, message: 'No stale requests found' });
  }

  // Update status to 'timeout'
  const ids = staleSignatures.map(req => req.id);
  const { error: updateErr } = await supabase
    .from('esignature_requests')
    .update({ status: 'timeout' })
    .in('id', ids);

  if (updateErr) {
    return NextResponse.json({ error: 'Failed to transition to timeout', details: updateErr.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, count: ids.length, expired_ids: ids });
}
