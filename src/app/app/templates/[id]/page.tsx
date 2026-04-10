import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { notFound } from 'next/navigation';
import TemplateEditClient from './TemplateEditClient';

async function getTemplate(id: string) {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return null;

    const { data } = await supabase
      .from('phase_templates')
      .select('id, name, description, is_default, phases')
      .eq('id', id)
      .eq('organization_id', ctx.organizationId)
      .single();

    return data;
  } catch {
    return null;
  }
}

export default async function TemplateEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const template = await getTemplate(id);
  if (!template) notFound();

  return (
    <TemplateEditClient
      template={{
        id: template.id,
        name: template.name,
        description: template.description,
        is_default: template.is_default,
        phases: template.phases ?? [],
      }}
    />
  );
}
