'use client';

import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';

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
      <EmptyState
        message="No custom fields defined yet"
        action={
          <Button className="mt-4">
            Add Custom Field
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-background overflow-hidden">
        <div className="divide-y divide-border">
          {fields.map((field) => (
            <div key={field.id} className="flex items-center justify-between px-6 py-3.5">
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-sm font-medium text-foreground">{field.fieldName}</p>
                  <p className="text-xs text-text-secondary capitalize">{field.fieldType}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="muted" className="capitalize">
                  {field.entityType}
                </Badge>
                {field.required && (
                  <Badge variant="error">
                    Required
                  </Badge>
                )}
                <button className="text-xs text-text-muted hover:text-foreground transition-colors">
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Show available types for reference */}
      <div className="rounded-xl border border-border bg-background px-6 py-4">
        <p className="text-xs text-text-muted mb-2">Available field types:</p>
        <div className="flex flex-wrap gap-2">
          {FIELD_TYPES.map((type) => (
            <Badge key={type} variant="muted" className="capitalize">
              {type}
            </Badge>
          ))}
        </div>
        <p className="text-xs text-text-muted mt-3 mb-2">Available entity types:</p>
        <div className="flex flex-wrap gap-2">
          {ENTITY_TYPES.map((type) => (
            <Badge key={type} variant="muted" className="capitalize">
              {type}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}

