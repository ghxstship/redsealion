import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import CountWorksheetClient from './CountWorksheetClient';

export default async function CountWorksheetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const ctx = await resolveCurrentOrg();
  if (!ctx) notFound();

  const { data: count } = await supabase
    .from('inventory_counts')
    .select('*')
    .eq('id', id)
    .eq('organization_id', ctx.organizationId)
    .single();

  if (!count) notFound();

  const { data: lines } = await supabase
    .from('inventory_count_lines')
    .select('*, asset:assets(id, name, barcode, serial_number, category, condition)')
    .eq('count_id', id);

  return (
    <CountWorksheetClient
      count={{
        id: count.id,
        count_type: count.count_type,
        status: count.status,
        location: count.location,
        started_at: count.started_at,
        completed_at: count.completed_at,
      }}
      lines={(lines ?? []).map((l) => {
        const asset = l.asset as Record<string, unknown> | null;
        return {
          id: l.id,
          asset_id: l.asset_id,
          asset_name: (asset?.name as string) ?? 'Unknown',
          asset_barcode: (asset?.barcode as string) ?? null,
          asset_serial: (asset?.serial_number as string) ?? null,
          asset_category: (asset?.category as string) ?? 'Other',
          asset_condition: (asset?.condition as string) ?? 'unknown',
          expected_quantity: l.expected_quantity,
          counted_quantity: l.counted_quantity,
          variance: l.variance,
          condition_observed: l.condition_observed,
          notes: l.notes,
        };
      })}
    />
  );
}
