import { NextRequest, NextResponse } from 'next/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { createClient } from '@/lib/supabase/server';
import { randomBytes, createHash } from 'crypto';

/**
 * Legacy settings API keys endpoint — now enriched with Harbor Master fields
 * (role_id, is_active, rate_limit_rpm, allowed_ips).
 * Shares the same api_keys table as /api/v1/api-keys.
 */

function generateApiKey(): { key: string; prefix: string; hash: string } {
  const raw = randomBytes(32).toString('hex');
  const key = `fd_live_${raw}`;
  const prefix = `fd_live_${raw.slice(0, 4)}`;
  const hash = createHash('sha256').update(key).digest('hex');
  return { key, prefix, hash };
}

export async function GET() {
  const perm = await checkPermission('settings', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('api_keys')
    .select('id, name, key_prefix, scopes, is_active, rate_limit_rpm, created_at, last_used_at, expires_at, created_by')
    .eq('organization_id', perm.organizationId)
    .is('revoked_at', null)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ keys: data });
}

export async function POST(request: NextRequest) {
  const perm = await checkPermission('settings', 'edit');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json();
  const { name, scopes = [], expires_at } = body;

  if (!name) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 });
  }

  const { key, prefix, hash } = generateApiKey();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('api_keys')
    .insert({
      organization_id: perm.organizationId,
      name,
      key_hash: hash,
      key_prefix: prefix,
      scopes,
      expires_at: expires_at ?? null,
      created_by: perm.userId,
    })
    .select('id, name, key_prefix, scopes, created_at, last_used_at')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Return the full key only once
  return NextResponse.json({ key, api_key: data });
}

export async function DELETE(request: NextRequest) {
  const perm = await checkPermission('settings', 'edit');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json();
  const { id } = body;

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('api_keys')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', id)
    .eq('organization_id', perm.organizationId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
