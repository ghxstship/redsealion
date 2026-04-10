import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AssetDetailClient from '@/components/admin/assets/AssetDetailClient';

export default async function AssetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch asset — C-6: filter soft-deleted
  const { data: asset } = await supabase
    .from('assets')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (!asset) notFound();

  // Fetch proposal name
  const { data: proposal } = asset.proposal_id
    ? await supabase.from('proposals').select('name').eq('id', asset.proposal_id).single()
    : { data: null };

  // Fetch location history
  const { data: locationHistory } = await supabase
    .from('asset_location_history')
    .select('*')
    .eq('asset_id', id)
    .order('moved_at', { ascending: false });

  const history = (locationHistory ?? []).map((entry) => {
    const loc = (entry as Record<string, unknown>).to_location as { name?: string } | null
      ?? entry.location as { name?: string } | null;
    return {
      id: entry.id,
      location: loc?.name ?? 'Unknown',
      moved_at: entry.moved_at,
      condition: entry.condition_at_move ?? 'unknown',
      notes: entry.notes ?? '',
    };
  });

  // C-5: Access lifecycle fields safely — these exist from migration 00055+
  // Using a typed accessor to avoid Record<string, unknown> casts throughout.
  const a = asset as Record<string, unknown>;

  return (
    <AssetDetailClient
      asset={{
        id: asset.id,
        name: asset.name,
        type: asset.type,
        category: asset.category,
        status: asset.status,
        condition: asset.condition,
        barcode: asset.barcode,
        description: asset.description,
        dimensions: asset.dimensions,
        weight: asset.weight,
        material: asset.material,
        storage_requirements: asset.storage_requirements,
        acquisition_cost: asset.acquisition_cost,
        current_value: asset.current_value,
        depreciation_method: asset.depreciation_method,
        useful_life_months: asset.useful_life_months,
        deployment_count: asset.deployment_count,
        max_deployments: asset.max_deployments,
        is_reusable: asset.is_reusable,
        photo_urls: asset.photo_urls,
        warranty_start_date: (a.warranty_start_date as string) ?? null,
        warranty_end_date: (a.warranty_end_date as string) ?? null,
        warranty_provider: (a.warranty_provider as string) ?? null,
        vendor_name: (a.vendor_name as string) ?? null,
        insurance_policy_number: (a.insurance_policy_number as string) ?? null,
        insurance_expiry_date: (a.insurance_expiry_date as string) ?? null,
        disposed_at: (a.disposed_at as string) ?? null,
        disposal_method: (a.disposal_method as string) ?? null,
        disposal_proceeds: (a.disposal_proceeds as number) ?? null,
        disposal_reason: (a.disposal_reason as string) ?? null,
        retired_at: (a.retired_at as string) ?? null,
        serial_number: (a.serial_number as string) ?? null,
        total_usage_hours: (a.total_usage_hours as number) ?? null,
        last_failure_at: (a.last_failure_at as string) ?? null,
        purchase_order_id: (a.purchase_order_id as string) ?? null,
        created_at: asset.created_at,
      }}
      proposalId={asset.proposal_id ?? null}
      proposalName={proposal?.name ?? null}
      locationHistory={history}
    />
  );
}
