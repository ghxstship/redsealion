'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import FormInput from '@/components/ui/FormInput';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

interface TimesheetRow {
  project: string;
  hours: number[];
}

export default function WeeklyTimesheet() {
  const [rows, setRows] = useState<TimesheetRow[]>([
    { project: 'General', hours: [8, 8, 8, 8, 8, 0, 0] },
  ]);

  const updateHours = (rowIdx: number, dayIdx: number, value: string) => {
    const num = parseFloat(value) || 0;
    setRows((prev) =>
      prev.map((row, i) =>
        i === rowIdx
          ? { ...row, hours: row.hours.map((h, d) => (d === dayIdx ? num : h)) }
          : row
      )
    );
  };

  const addRow = () => {
    setRows((prev) => [...prev, { project: '', hours: [0, 0, 0, 0, 0, 0, 0] }]);
  };

  const totalByDay = DAYS.map((_, dayIdx) =>
    rows.reduce((sum, row) => sum + row.hours[dayIdx], 0)
  );
  const grandTotal = totalByDay.reduce((s, h) => s + h, 0);

  return (
    <div className="rounded-xl border border-border bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-bg-secondary">
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">
                Project
              </th>
              {DAYS.map((day) => (
                <th
                  key={day}
                  className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-text-muted w-20"
                >
                  {day}
                </th>
              ))}
              <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-text-muted w-20">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row, rowIdx) => {
              const rowTotal = row.hours.reduce((s, h) => s + h, 0);
              return (
                <tr key={rowIdx} className="transition-colors hover:bg-bg-secondary/50">
                  <td className="px-6 py-2">
                    <FormInput
                      type="text"
                      value={row.project}
                      onChange={(e) =>
                        setRows((prev) =>
                          prev.map((r, i) =>
                            i === rowIdx ? { ...r, project: e.target.value } : r
                          )
                        )
                      }
                      placeholder="Project name" />
                  </td>
                  {DAYS.map((day, dayIdx) => (
                    <td key={day} className="px-2 py-2 text-center">
                      <FormInput
                        type="number"
                        min="0"
                        max="24"
                        step="0.5"
                        value={row.hours[dayIdx]}
                        onChange={(e) => updateHours(rowIdx, dayIdx, e.target.value)} />
                    </td>
                  ))}
                  <td className="px-4 py-2 text-center text-sm font-medium tabular-nums text-foreground">
                    {rowTotal}h
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-border bg-bg-secondary">
              <td className="px-6 py-3 text-sm font-medium text-foreground">
                Daily Total
              </td>
              {totalByDay.map((total, idx) => (
                <td
                  key={idx}
                  className="px-4 py-3 text-center text-sm font-medium tabular-nums text-foreground"
                >
                  {total}h
                </td>
              ))}
              <td className="px-4 py-3 text-center text-sm font-semibold tabular-nums text-foreground">
                {grandTotal}h
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-border px-6 py-4">
        <button
          onClick={addRow}
          className="text-sm font-medium text-text-secondary hover:text-foreground transition-colors"
        >
          + Add Row
        </button>
        <Button>
          Submit Timesheet
        </Button>
      </div>
    </div>
  );
}
