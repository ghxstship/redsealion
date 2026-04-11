import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { notFound } from 'next/navigation';
import AdvanceDetailClient from '@/components/admin/advances/AdvanceDetailClient';

async function getAdvanceDetail(id: string) {
  const supabase = await createClient();
  const ctx = await resolveCurrentOrg();
  if (!ctx) return null;

  const { data: advance } = await supabase
    .from('production_advances')
    .select('*, projects(name)')
    .eq('id', id)
    .eq('organization_id', ctx.organizationId)
    .single();

  if (!advance) return null;

  const { data: lineItems } = await supabase
    .from('advance_line_items')
    .select('*')
    .eq('advance_id', id)
    .is('deleted_at', null)
    .order('sort_order', { ascending: true });

  const { data: statusHistory } = await supabase
    .from('advance_status_history')
    .select('*')
    .eq('advance_id', id)
    .order('created_at', { ascending: true });

  const { data: comments } = await supabase
    .from('advance_comments')
    .select('*, users(full_name, avatar_url)')
    .eq('advance_id', id)
    .order('created_at', { ascending: true });

  let collaborators = null;
  if ((advance as Record<string, unknown>).advance_mode === 'collection') {
    const { data } = await supabase
      .from('advance_collaborators')
      .select('*, users(full_name, email), organizations(name)')
      .eq('advance_id', id)
      .is('deleted_at', null)
      .order('invited_at', { ascending: true });
    collaborators = data;
  }

  return {
    advance,
    lineItems: lineItems ?? [],
    statusHistory: statusHistory ?? [],
    comments: comments ?? [],
    collaborators,
    isOrgMember: (advance as Record<string, unknown>).organization_id === ctx.organizationId,
  };
}

export default async function AdvanceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getAdvanceDetail(id);
  if (!data) notFound();

  return <AdvanceDetailClient data={data} />;
}
