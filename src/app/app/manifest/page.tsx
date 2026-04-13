import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { notFound } from 'next/navigation';
import { TierGate } from '@/components/shared/TierGate';
import ManifestClient from './ManifestClient';

export default async function ManifestPage() {
  const supabase = await createClient();
  const ctx = await resolveCurrentOrg();
  if (!ctx) notFound();

  // Load all projects with events for scope selection
  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, slug, hierarchy_status')
    .eq('organization_id', ctx.organizationId)
    .is('deleted_at', null)
    .order('name');

  // Load all events for scope selection
  const { data: events } = await supabase
    .from('events')
    .select('id, name, slug, starts_at, ends_at, hierarchy_status')
    .eq('organization_id', ctx.organizationId)
    .is('deleted_at', null)
    .order('starts_at', { ascending: false });

  // Load catalog collection groups for vertical filter pills
  const { data: groups } = await supabase
    .from('advance_category_groups')
    .select('id, name, slug, color_hex, icon')
    .eq('organization_id', ctx.organizationId)
    .order('sort_order');

  return (
    <TierGate feature="advancing">
      <ManifestClient
        orgId={ctx.organizationId}
        projects={projects ?? []}
        events={events ?? []}
        catalogGroups={groups ?? []}
      />
    </TierGate>
  );
}
