import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { createLogger } from '@/lib/logger';

const log = createLogger('cron:compliance-expiry');

/**
 * POST /api/cron/compliance-expiry
 * Checks for compliance documents nearing expiry (30/14/7 days).
 * Creates notifications for org admins.
 */
export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createServiceClient();
  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 86400000).toISOString().split('T')[0];

  const { data: expiring, error } = await supabase
    .from('compliance_documents')
    .select('id, title, type, expiry_date, organization_id, crew_profile_id')
    .lte('expiry_date', in30Days)
    .gte('expiry_date', now.toISOString().split('T')[0])
    .order('expiry_date', { ascending: true });

  if (error) {
    log.error('Failed to check compliance expiry', {}, error);
    return NextResponse.json({ error: 'Failed to check' }, { status: 500 });
  }

  let notified = 0;
  for (const doc of expiring ?? []) {
    const daysLeft = Math.ceil((new Date(doc.expiry_date).getTime() - now.getTime()) / 86400000);

    // Only notify at 30, 14, 7, 1 day thresholds
    if (![30, 14, 7, 1].includes(daysLeft)) continue;

    await supabase.from('notifications').insert({
      organization_id: doc.organization_id,
      type: 'compliance_expiry',
      title: `${doc.type} expiring in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`,
      body: `${doc.title} expires on ${doc.expiry_date}.`,
      metadata: { document_id: doc.id, crew_profile_id: doc.crew_profile_id },
    });
    notified++;
  }

  log.info('Compliance expiry check complete', { expiring: expiring?.length ?? 0, notified });
  return NextResponse.json({ expiring: expiring?.length ?? 0, notified });
}
