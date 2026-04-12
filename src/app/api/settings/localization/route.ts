import { NextRequest, NextResponse } from 'next/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { createClient } from '@/lib/supabase/server';
import { hasLocale, normalizeBareCode } from '@/lib/i18n/config';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const perm = await checkPermission('settings', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('organizations')
    .select('date_format, time_format, first_day_of_week, number_format, language')
    .eq('id', perm.organizationId)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function PUT(request: NextRequest) {
  const perm = await checkPermission('settings', 'edit');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json();
  const allowedFields = ['date_format', 'time_format', 'first_day_of_week', 'number_format', 'language'];

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      // Normalize language to BCP-47 if it's a bare code
      if (field === 'language') {
        const lang = String(body[field]);
        updateData[field] = hasLocale(lang) ? lang : normalizeBareCode(lang);
      } else {
        updateData[field] = body[field];
      }
    }
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('organizations')
    .update(updateData)
    .eq('id', perm.organizationId)
    .select('date_format, time_format, first_day_of_week, number_format, language')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
