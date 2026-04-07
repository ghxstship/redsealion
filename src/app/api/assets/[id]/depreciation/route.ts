import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';
import {
  generateDepreciationSchedule,
  type DepreciationMethod,
} from '@/lib/assets/depreciation';

/**
 * GET /api/assets/[id]/depreciation
 * Returns the calculated depreciation schedule and any persisted entries.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const perm = await checkPermission('assets', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const supabase = await createClient();

  // Fetch asset
  const { data: asset, error: assetError } = await supabase
    .from('assets')
    .select('id, name, acquisition_cost, current_value, depreciation_method, useful_life_months, created_at')
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .single();

  if (assetError || !asset) {
    return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
  }

  if (!asset.acquisition_cost || !asset.useful_life_months || !asset.depreciation_method) {
    return NextResponse.json({
      schedule: [],
      message: 'Asset is missing depreciation configuration (acquisition_cost, useful_life_months, or depreciation_method).',
    });
  }

  // Fetch existing persisted entries
  const { data: existingEntries } = await supabase
    .from('asset_depreciation_entries')
    .select()
    .eq('asset_id', id)
    .order('period_number', { ascending: true });

  // Generate projected schedule
  const schedule = generateDepreciationSchedule({
    acquisitionCost: asset.acquisition_cost,
    usefulLifeMonths: asset.useful_life_months,
    method: asset.depreciation_method as DepreciationMethod,
    startDate: asset.created_at.split('T')[0],
  });

  return NextResponse.json({
    asset: {
      id: asset.id,
      name: asset.name,
      acquisitionCost: asset.acquisition_cost,
      currentValue: asset.current_value,
      method: asset.depreciation_method,
      usefulLifeMonths: asset.useful_life_months,
    },
    schedule,
    persistedEntries: existingEntries ?? [],
  });
}

/**
 * POST /api/assets/[id]/depreciation
 * Generate and persist depreciation entries up to a given date.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const perm = await checkPermission('assets', 'edit');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const { through_period } = body as { through_period?: number };

  const supabase = await createClient();

  // Fetch asset
  const { data: asset } = await supabase
    .from('assets')
    .select('id, acquisition_cost, depreciation_method, useful_life_months, created_at')
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .single();

  if (!asset) {
    return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
  }

  if (!asset.acquisition_cost || !asset.useful_life_months || !asset.depreciation_method) {
    return NextResponse.json(
      { error: 'Asset is missing depreciation configuration.' },
      { status: 400 },
    );
  }

  // Count existing entries
  const { count } = await supabase
    .from('asset_depreciation_entries')
    .select('id', { count: 'exact', head: true })
    .eq('asset_id', id);

  const existingCount = count ?? 0;
  const targetPeriod = through_period ?? asset.useful_life_months;

  if (existingCount >= targetPeriod) {
    return NextResponse.json({
      message: `All ${existingCount} periods already generated.`,
      created: 0,
    });
  }

  // Generate remaining schedule
  const schedule = generateDepreciationSchedule({
    acquisitionCost: asset.acquisition_cost,
    usefulLifeMonths: asset.useful_life_months,
    method: asset.depreciation_method as DepreciationMethod,
    startDate: asset.created_at.split('T')[0],
    existingPeriods: existingCount,
  });

  const entriesToCreate = schedule
    .filter((e) => e.periodNumber <= targetPeriod)
    .map((e) => ({
      asset_id: id,
      organization_id: perm.organizationId,
      entry_date: e.entryDate,
      depreciation_amount: e.depreciationAmount,
      accumulated_depreciation: e.accumulatedDepreciation,
      book_value: e.bookValue,
      method: asset.depreciation_method!,
      period_number: e.periodNumber,
    }));

  if (entriesToCreate.length === 0) {
    return NextResponse.json({ message: 'No new entries to create.', created: 0 });
  }

  const { error: insertError } = await supabase
    .from('asset_depreciation_entries')
    .insert(entriesToCreate);

  if (insertError) {
    return NextResponse.json(
      { error: 'Failed to create depreciation entries.', details: insertError.message },
      { status: 500 },
    );
  }

  // Update asset current_value to latest book value
  const lastEntry = entriesToCreate[entriesToCreate.length - 1];
  await supabase
    .from('assets')
    .update({ current_value: lastEntry.book_value })
    .eq('id', id)
    .eq('organization_id', perm.organizationId);

  // Record in value history
  await supabase.from('asset_value_history').insert({
    asset_id: id,
    organization_id: perm.organizationId,
    previous_value: asset.acquisition_cost,
    new_value: lastEntry.book_value,
    change_type: 'depreciation',
    reason: `Depreciation through period ${lastEntry.period_number}`,
    changed_by: perm.userId,
  });

  return NextResponse.json({
    success: true,
    created: entriesToCreate.length,
    currentBookValue: lastEntry.book_value,
  });
}
