import { createClient } from '@/lib/supabase/server';
import { TierGate } from '@/components/shared/TierGate';
import CustomFieldRenderer from '@/components/admin/custom-fields/CustomFieldRenderer';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';

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
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Custom Fields
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Define custom data fields for proposals, tasks, and other entities.
        </p>
      </div>

      <CustomFieldRenderer fields={fields} />
    </TierGate>
  );
}
