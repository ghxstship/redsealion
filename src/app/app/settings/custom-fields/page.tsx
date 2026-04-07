import { createClient } from '@/lib/supabase/server';
import { TierGate } from '@/components/shared/TierGate';
import CustomFieldRenderer from '@/components/admin/custom-fields/CustomFieldRenderer';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import PageHeader from '@/components/shared/PageHeader';

interface FieldDef {
  id: string;
  entityType: string;
  fieldName: string;
  fieldType: string;
  required: boolean;
}

async function getCustomFields(): Promise<FieldDef[]> {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) throw new Error('No auth');

    const { data } = await supabase
      .from('custom_field_definitions')
      .select('id, entity_type, field_name, field_type, required')
      .eq('organization_id', ctx.organizationId)
      .order('sort_order');

    return (data ?? []).map((f) => ({
      id: f.id,
      entityType: f.entity_type,
      fieldName: f.field_name,
      fieldType: f.field_type,
      required: f.required,
    }));
  } catch {
    return [];
  }
}

export default async function CustomFieldsPage() {
  const fields = await getCustomFields();

  return (
    <TierGate feature="custom_fields">
<PageHeader
        title="Custom Fields"
        subtitle="Define custom data fields for proposals, tasks, and other entities."
      />

      <CustomFieldRenderer fields={fields} />
    </TierGate>
  );
}
