'use client';

import { useState } from 'react';

interface FieldMapping {
  flyteDeckField: string;
  targetField: string;
}

interface MappingCategory {
  name: string;
  mappings: FieldMapping[];
}

interface ExportPreviewProps {
  platformName: string;
  categories: MappingCategory[];
}

export default function ExportPreview({
  platformName,
  categories,
}: ExportPreviewProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    () => new Set(categories.length > 0 ? [categories[0].name] : []),
  );

  function toggleCategory(name: string) {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  }

  return (
    <div className="rounded-xl border border-border bg-white overflow-hidden">
      <div className="px-5 py-4 border-b border-border bg-bg-secondary">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          Field Mapping — {platformName}
        </h3>
      </div>
      <div className="divide-y divide-border">
        {categories.map((category) => {
          const isExpanded = expandedCategories.has(category.name);
          return (
            <div key={category.name}>
              <button
                onClick={() => toggleCategory(category.name)}
                className="flex w-full items-center justify-between px-5 py-3 text-left hover:bg-bg-secondary/50 transition-colors"
              >
                <span className="text-sm font-medium text-foreground">
                  {category.name}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-text-muted">
                    {category.mappings.length} fields
                  </span>
                  <svg
                    className={`h-4 w-4 text-text-muted transition-transform ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </button>
              {isExpanded && (
                <div className="px-5 pb-4">
                  <div className="rounded-lg border border-border overflow-hidden">
                    <div className="grid grid-cols-2 bg-bg-secondary px-4 py-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                        FlyteDeck Field
                      </span>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                        {platformName} Field
                      </span>
                    </div>
                    <div className="divide-y divide-border">
                      {category.mappings.map((mapping) => (
                        <div
                          key={mapping.flyteDeckField}
                          className="grid grid-cols-2 px-4 py-2"
                        >
                          <span className="text-xs text-foreground font-mono">
                            {mapping.flyteDeckField}
                          </span>
                          <span className="text-xs text-text-secondary font-mono">
                            {mapping.targetField}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
