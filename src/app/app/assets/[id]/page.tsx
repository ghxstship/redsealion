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

  // Fetch asset
  const { data: asset } = await supabase
    .from('assets')
    .select('*')
    .eq('id', id)
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
    const loc = entry.location as { name?: string } | null;
    return {
      id: entry.id,
      location: loc?.name ?? 'Unknown',
      moved_at: entry.moved_at,
      condition: entry.condition_at_move ?? 'unknown',
      notes: entry.notes ?? '',
    };
  });

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
        warranty_start_date: (asset as Record<string, unknown>).warranty_start_date as string | null ?? null,
        warranty_end_date: (asset as Record<string, unknown>).warranty_end_date as string | null ?? null,
        warranty_provider: (asset as Record<string, unknown>).warranty_provider as string | null ?? null,
        vendor_name: (asset as Record<string, unknown>).vendor_name as string | null ?? null,
        insurance_policy_number: (asset as Record<string, unknown>).insurance_policy_number as string | null ?? null,
        insurance_expiry_date: (asset as Record<string, unknown>).insurance_expiry_date as string | null ?? null,
        disposed_at: (asset as Record<string, unknown>).disposed_at as string | null ?? null,
        disposal_method: (asset as Record<string, unknown>).disposal_method as string | null ?? null,
        disposal_proceeds: (asset as Record<string, unknown>).disposal_proceeds as number | null ?? null,
        retired_at: (asset as Record<string, unknown>).retired_at as string | null ?? null,
        created_at: asset.created_at,
      }}
      proposalName={proposal?.name ?? null}
      locationHistory={history}
    />
  );
}
