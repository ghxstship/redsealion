import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { createLogger } from '@/lib/logger';

const log = createLogger('api:crew:import');

/**
 * POST /api/crew/import — bulk import crew profiles.
 */
export async function POST(request: Request) {
  const perm = await checkPermission('crew', 'create');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json();
  const { entries } = body;

  if (!Array.isArray(entries) || entries.length === 0) {
    return NextResponse.json({ error: 'entries array is required' }, { status: 400 });
  }

  const supabase = await createClient();
  const results: Array<{ index: number; id?: string; error?: string }> = [];

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    try {
      const { data, error } = await supabase
        .from('crew_profiles')
        .insert({
          organization_id: perm.organizationId,
          user_id: entry.user_id ?? null,
          full_name: entry.full_name ?? entry.name ?? '',
          skills: entry.skills ?? [],
          hourly_rate: entry.hourly_rate ?? null,
          day_rate: entry.day_rate ?? null,
          bio: entry.bio ?? null,
          phone: entry.phone ?? null,
          availability_default: entry.availability_default ?? 'available',
        })
        .select('id')
        .single();

      if (error) {
        results.push({ index: i, error: error.message });
      } else {
        results.push({ index: i, id: data.id });
      }
    } catch (err) {
      results.push({ index: i, error: String(err) });
    }
  }

  const successCount = results.filter((r) => r.id).length;
  const failCount = results.filter((r) => r.error).length;

  log.info('Crew bulk import complete', { total: entries.length, success: successCount, failed: failCount });

  return NextResponse.json({
    total: entries.length,
    success: successCount,
    failed: failCount,
    results,
  }, { status: successCount > 0 ? 201 : 400 });
}
