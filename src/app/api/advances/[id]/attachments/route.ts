import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth-guard';

/**
 * GET  /api/advances/[id]/attachments — List attachments
 * POST /api/advances/[id]/attachments — Upload attachment metadata
 *
 * Gap: T-04 — File attachments on advances (CAD drawings, PDFs, etc.)
 */

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { ctx, denied } = await requireAuth();
  if (denied) return denied;
  const { id } = await params;

  const { data, error } = await ctx.supabase
    .from('advance_attachments')
    .select('*')
    .eq('advance_id', id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch attachments', details: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [] });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { ctx, denied } = await requireAuth();
  if (denied) return denied;
  const { id } = await params;
  const body = await request.json();
  const b = body as Record<string, unknown>;

  if (!b.file_name || !b.file_url) {
    return NextResponse.json({ error: 'file_name and file_url are required' }, { status: 422 });
  }

  const { data, error } = await ctx.supabase
    .from('advance_attachments')
    .insert({
      organization_id: ctx.organizationId,
      advance_id: id,
      line_item_id: b.line_item_id ?? null,
      file_name: b.file_name,
      file_url: b.file_url,
      file_type: b.file_type ?? null,
      file_size_bytes: b.file_size_bytes ?? null,
      uploaded_by: ctx.userId,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to add attachment', details: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
