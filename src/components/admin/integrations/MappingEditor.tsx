'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import FormSelect from '@/components/ui/FormSelect';

interface FieldMapping {
  id: string;
  sourceField: string;
  targetField: string;
  transform: string;
}

interface MappingEditorProps {
  platform: string;
  sourceFields: string[];
  targetFields: string[];
  initialMappings?: FieldMapping[];
  onSave: (mappings: FieldMapping[]) => void;
}

export function MappingEditor({
  platform,
  sourceFields,
  targetFields,
  initialMappings = [],
  onSave,
}: MappingEditorProps) {
  const [mappings, setMappings] = useState<FieldMapping[]>(initialMappings);

  function addMapping() {
    setMappings((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        sourceField: sourceFields[0] ?? '',
        targetField: targetFields[0] ?? '',
        transform: 'none',
      },
    ]);
  }

  function removeMapping(id: string) {
    setMappings((prev) => prev.filter((m) => m.id !== id));
  }

  function updateMapping(id: string, field: keyof FieldMapping, value: string) {
    setMappings((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: value } : m)),
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          Field Mappings - {platform}
        </h3>
        <Button size="sm" onClick={addMapping}>
          Add Mapping
        </Button>
      </div>

      {mappings.length === 0 && (
        <p className="text-sm text-text-muted py-4 text-center">
          No field mappings configured. Click &quot;Add Mapping&quot; to get started.
        </p>
      )}

      <div className="space-y-2">
        {mappings.map((mapping) => (
          <div
            key={mapping.id}
            className="flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-3"
          >
            <FormSelect
              value={mapping.sourceField}
              onChange={(e) => updateMapping(mapping.id, 'sourceField', e.target.value)}
            >
              {sourceFields.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </FormSelect>

            <span className="text-text-muted text-xs font-medium shrink-0">maps to</span>

            <FormSelect
              value={mapping.targetField}
              onChange={(e) => updateMapping(mapping.id, 'targetField', e.target.value)}
            >
              {targetFields.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </FormSelect>

            <FormSelect
              value={mapping.transform}
              onChange={(e) => updateMapping(mapping.id, 'transform', e.target.value)}
            >
              <option value="none">No transform</option>
              <option value="uppercase">Uppercase</option>
              <option value="lowercase">Lowercase</option>
              <option value="trim">Trim</option>
            </FormSelect>

            <button
              onClick={() => removeMapping(mapping.id)}
              className="shrink-0 text-text-muted hover:text-red-600 transition-colors text-sm"
              aria-label="Remove mapping"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      {mappings.length > 0 && (
        <div className="flex justify-end">
          <Button
            onClick={() => onSave(mappings)}
            className="transition-opacity"
          >
            Save Mappings
          </Button>
        </div>
      )}
    </div>
  );
}
