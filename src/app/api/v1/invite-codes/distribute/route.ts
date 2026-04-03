import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/v1/invite-codes/distribute — Distribute codes via email/CSV/QR
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { code_ids, method, recipients } = body as {
    code_ids?: string[];
    method?: 'email' | 'csv' | 'clipboard';
    recipients?: Array<{ email: string; name?: string }>;
  };

  if (!code_ids || code_ids.length === 0) {
    return NextResponse.json({ error: 'code_ids is required' }, { status: 400 });
  }

  if (!method) {
    return NextResponse.json({ error: 'method is required (email, csv, clipboard)' }, { status: 400 });
  }

  // Fetch codes
  const { data: codes } = await supabase
    .from('invite_codes')
    .select('id, code, organization_id, scope_type, role_id, expires_at')
    .in('id', code_ids);

  if (!codes || codes.length === 0) {
    return NextResponse.json({ error: 'No valid codes found' }, { status: 404 });
  }

  const orgId = codes[0].organization_id as string;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  if (method === 'email') {
    if (!recipients || recipients.length === 0) {
      return NextResponse.json({ error: 'recipients required for email distribution' }, { status: 400 });
    }

    // Rate limiting check
    const { count } = await supabase
      .from('audit_log')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('action', 'invite_code.distributed')
      .gte('created_at', new Date(Date.now() - 3600000).toISOString());

    if ((count ?? 0) > 50) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Max 50 distributions per hour.', retry_after: 3600 },
        { status: 429 },
      );
    }

    // In production: send emails to recipients with code links
    const results = recipients.map((r, i) => ({
      email: r.email,
      code: codes[i % codes.length].code,
      link: `${baseUrl}/join?code=${codes[i % codes.length].code}`,
      status: 'queued',
    }));

    supabase.from('audit_log').insert({
      organization_id: orgId,
      user_id: user.id,
      actor_type: 'user',
      action: 'invite_code.distributed',
      entity_type: 'invite_code',
      resource_type: 'invite_code',
      entity_id: codes[0].id,
      changes: {},
      metadata: { method, recipient_count: recipients.length },
    }).then(() => {});

    return NextResponse.json({ success: true, method: 'email', results });
  }

  if (method === 'csv') {
    const csvRows = ['code,scope_type,role_id,expires_at,redemption_url'];
    for (const c of codes) {
      csvRows.push(`${c.code},${c.scope_type},${c.role_id},${c.expires_at ?? ''},${baseUrl}/join?code=${c.code}`);
    }
    return NextResponse.json({ success: true, method: 'csv', csv: csvRows.join('\n') });
  }

  // clipboard — return links
  const links = codes.map(c => ({
    code: c.code,
    link: `${baseUrl}/join?code=${c.code}`,
  }));

  return NextResponse.json({ success: true, method: 'clipboard', links });
}
