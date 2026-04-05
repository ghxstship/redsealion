import { NextRequest, NextResponse } from 'next/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const perm = await checkPermission('referral_program', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = await createClient();

  const { data: program } = await supabase
    .from('referral_programs')
    .select()
    .eq('organization_id', perm.organizationId)
    .single();

  const { data: referrals } = await supabase
    .from('referrals')
    .select('*, clients!referrals_referrer_client_id_fkey(company_name)')
    .eq('organization_id', perm.organizationId)
    .order('created_at', { ascending: false });

  return NextResponse.json({ program: program ?? null, referrals: referrals ?? [] });
}

export async function POST(request: NextRequest) {
  const perm = await checkPermission('referral_program', 'create');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const { referrer_client_id } = body;

  if (!referrer_client_id) return NextResponse.json({ error: 'referrer_client_id is required.' }, { status: 400 });

  const supabase = await createClient();

  // Get or create program
  let { data: program } = await supabase
    .from('referral_programs')
    .select()
    .eq('organization_id', perm.organizationId)
    .single();

  if (!program) {
    const { data: newProgram } = await supabase
      .from('referral_programs')
      .insert({ organization_id: perm.organizationId })
      .select()
      .single();
    program = newProgram;
  }

  if (!program) return NextResponse.json({ error: 'Failed to create referral program.' }, { status: 500 });

  // Generate unique code
  const code = `REF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  const { data: referral, error } = await supabase
    .from('referrals')
    .insert({
      organization_id: perm.organizationId,
      program_id: program.id,
      referrer_client_id,
      referral_code: code,
    })
    .select()
    .single();

  if (error || !referral) return NextResponse.json({ error: 'Failed to create referral.', details: error?.message }, { status: 500 });

  return NextResponse.json({ success: true, referral });
}
