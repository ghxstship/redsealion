'use client';

import Button from '@/components/ui/Button';

interface FieldDef {
  id: string;
  entityType: string;
  fieldName: string;
  fieldType: string;
  required: boolean;
}

interface CustomFieldRendererProps {
  fields: FieldDef[];
}

const FIELD_TYPES = ['text', 'number', 'date', 'select', 'checkbox', 'url'] as const;
const ENTITY_TYPES = ['proposal', 'task', 'client', 'invoice'] as const;

export default function CustomFieldRenderer({ fields }: CustomFieldRendererProps) {
  if (fields.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-white px-8 py-16 text-center">
        <p className="text-sm text-text-secondary mb-4">
          No custom fields defined yet.
        </p>
        <Button>
          Add Custom Field
        </Button>
      </div>
    );
  }

  // Group by entity type
  const grouped = fields.reduce<Record<string, FieldDef[]>>((acc, field) => {
    (acc[field.entityType] = acc[field.entityType] ?? []).push(field);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([entityType, entityFields]) => (
        <div key={entityType} className="rounded-xl border border-border bg-white overflow-hidden">
          <div className="px-6 py-4 border-b border-border bg-bg-secondary">
            <h2 className="text-sm font-semibold text-foreground capitalize">
              {entityType} Fields
            </h2>
          </div>
          <div className="divide-y divide-border">
            {entityFields.map((field) => (
              <div key={field.id} className="flex items-center justify-between px-6 py-3.5">
                <div>
                  <p className="text-sm font-medium text-foreground">{field.fieldName}</p>
                  <p className="text-xs text-text-secondary capitalize">{field.fieldType}</p>
                </div>
                <div className="flex items-center gap-3">
                  {field.required && (
                    <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                      Required
                    </span>
                  )}
                  <button className="text-xs text-text-muted hover:text-foreground transition-colors">
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Show available types for reference */}
      <div className="rounded-xl border border-border bg-white px-6 py-4">
        <p className="text-xs text-text-muted mb-2">Available field types:</p>
        <div className="flex flex-wrap gap-2">
          {FIELD_TYPES.map((type) => (
            <span key={type} className="rounded-full bg-bg-secondary px-3 py-1 text-xs text-text-secondary capitalize">
              {type}
            </span>
          ))}
        </div>
        <p className="text-xs text-text-muted mt-3 mb-2">Available entity types:</p>
        <div className="flex flex-wrap gap-2">
          {ENTITY_TYPES.map((type) => (
            <span key={type} className="rounded-full bg-bg-secondary px-3 py-1 text-xs text-text-secondary capitalize">
              {type}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
