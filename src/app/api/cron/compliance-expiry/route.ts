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
  const todayStr = now.toISOString().split('T')[0];
  const in30Days = new Date(now.getTime() + 30 * 86400000).toISOString().split('T')[0];

  // Auto-expire documents past their expiry date
  const { data: expired, error: expireError } = await supabase
    .from('compliance_documents')
    .update({ status: 'expired' })
    .lt('expiry_date', todayStr)
    .not('status', 'in', '("rejected","expired")')
    .select('id');

  if (expireError) {
    log.error('Failed to auto-expire compliance documents', {}, expireError);
  } else {
    log.info('Auto-expired compliance documents', { count: expired?.length ?? 0 });
  }

  // Find documents expiring within 30 days
  const { data: expiring, error } = await supabase
    .from('compliance_documents')
    .select('id, document_name, document_type, expiry_date, organization_id, crew_profile_id')
    .lte('expiry_date', in30Days)
    .gte('expiry_date', todayStr)
    .not('status', 'in', '("rejected","expired")')
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

    const notifTitle = `${doc.document_type} expiring in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`;

    // GAP-M8: De-duplicate — check if notification already exists for this doc + threshold
    const { data: existing } = await supabase
      .from('notifications')
      .select('id')
      .eq('organization_id', doc.organization_id)
      .eq('type', 'compliance_expiry')
      .eq('title', notifTitle)
      .contains('metadata', { document_id: doc.id })
      .limit(1);

    if (existing && existing.length > 0) continue;

    // GAP-H5: Target admin/owner users specifically
    const { data: admins } = await supabase
      .from('organization_memberships')
      .select('user_id')
      .eq('organization_id', doc.organization_id)
      .eq('status', 'active')
      .in('role', ['owner', 'admin', 'collaborator']);

    for (const admin of admins ?? []) {
      await supabase.from('notifications').insert({
        organization_id: doc.organization_id,
        user_id: admin.user_id,
        type: 'compliance_expiry',
        title: notifTitle,
        body: `${doc.document_name} expires on ${doc.expiry_date}.`,
        metadata: { document_id: doc.id, crew_profile_id: doc.crew_profile_id },
      });
    }
    notified++;
  }

  log.info('Compliance expiry check complete', { expiring: expiring?.length ?? 0, notified, autoExpired: expired?.length ?? 0 });
  return NextResponse.json({ expiring: expiring?.length ?? 0, notified, autoExpired: expired?.length ?? 0 });
}
