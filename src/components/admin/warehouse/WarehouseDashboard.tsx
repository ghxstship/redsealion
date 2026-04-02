'use client';

import React from 'react';

interface Facility {
  id: string;
  name: string;
  assetCount: number;
  categories: Record<string, number>;
}

interface WarehouseDashboardProps {
  facilities: Facility[];
}

export default function WarehouseDashboard({ facilities }: WarehouseDashboardProps) {
  const totalAssets = facilities.reduce((sum, f) => sum + f.assetCount, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">Warehouse Overview</h2>
        <span className="text-xs text-text-muted">{totalAssets} total assets</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {facilities.map((facility) => {
          const categoryEntries = Object.entries(facility.categories).sort(
            ([, a], [, b]) => b - a,
          );

          return (
            <div
              key={facility.id}
              className="bg-white border border-border rounded-lg shadow-sm p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground truncate">
                  {facility.name}
                </h3>
                <span className="text-xs text-text-muted whitespace-nowrap ml-2">
                  {facility.assetCount} items
                </span>
              </div>

              {categoryEntries.length > 0 ? (
                <ul className="space-y-1.5">
                  {categoryEntries.map(([category, count]) => (
                    <li key={category} className="flex items-center justify-between">
                      <span className="text-xs text-text-secondary truncate">{category}</span>
                      <span className="text-xs font-medium text-foreground ml-2">{count}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-text-muted">No assets</p>
              )}
            </div>
          );
        })}
      </div>

      {facilities.length === 0 && (
        <div className="bg-white border border-border rounded-lg shadow-sm p-6 text-center">
          <p className="text-sm text-text-muted">No facilities found.</p>
        </div>
      )}
    </div>
  );
}
