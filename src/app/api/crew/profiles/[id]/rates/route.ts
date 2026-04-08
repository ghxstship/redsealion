import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { requirePermission } from '@/lib/api/permission-guard';

/**
 * PUT /api/crew/profiles/[id]/rates
 *
 * Updates pay rates for a crew profile.
 * Body: { hourly, day, ot, perDiem, travel } (all nullable numbers)
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const permError = await requirePermission('crew', 'edit');
  if (permError) return permError;

  const { id: profileId } = await params;
  const ctx = await resolveCurrentOrg();
  if (!ctx) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { hourly, day, ot, perDiem, travel } = body as {
    hourly: number | null;
    day: number | null;
    ot: number | null;
    perDiem: number | null;
    travel: number | null;
  };

  const supabase = await createClient();

  // Verify the profile belongs to this organization
  const { data: profile, error: findError } = await supabase
    .from('crew_profiles')
    .select('id')
    .eq('id', profileId)
    .eq('organization_id', ctx.organizationId)
    .single();

  if (findError || !profile) {
    return NextResponse.json({ error: 'Crew profile not found.' }, { status: 404 });
  }

  const { error: updateError } = await supabase
    .from('crew_profiles')
    .update({
      hourly_rate: hourly,
      day_rate: day,
      ot_rate: ot,
      per_diem_rate: perDiem,
      travel_rate: travel,
      updated_at: new Date().toISOString(),
    })
    .eq('id', profileId);

  if (updateError) {
    return NextResponse.json({ error: 'Failed to update rates.' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
