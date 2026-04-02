'use client';

interface UtilizationHeatMapProps {
  teamMembers: Array<{ id: string; name: string; role: string }>;
}

const WEEKS = ['W1', 'W2', 'W3', 'W4'] as const;

function getUtilColor(percent: number): string {
  if (percent === 0) return 'bg-gray-100';
  if (percent <= 25) return 'bg-green-100';
  if (percent <= 50) return 'bg-green-200';
  if (percent <= 75) return 'bg-green-400';
  if (percent <= 100) return 'bg-green-600';
  return 'bg-red-500';
}

export default function UtilizationHeatMap({ teamMembers }: UtilizationHeatMapProps) {
  // Generate mock utilization data
  const data = teamMembers.length > 0
    ? teamMembers.map((m) => ({
        name: m.name,
        role: m.role,
        weeks: WEEKS.map(() => Math.floor(Math.random() * 120)),
      }))
    : [
        { name: 'Sarah Chen', role: 'Designer', weeks: [80, 100, 60, 90] },
        { name: 'Mike Johnson', role: 'Fabricator', weeks: [100, 75, 110, 85] },
        { name: 'Emily Davis', role: 'PM', weeks: [90, 90, 95, 70] },
        { name: 'Alex Kim', role: 'Installer', weeks: [50, 40, 80, 100] },
      ];

  return (
    <div className="rounded-xl border border-border bg-white overflow-hidden">
      <div className="px-6 py-4 border-b border-border">
        <h2 className="text-base font-semibold text-foreground">Utilization Heat Map</h2>
        <p className="text-xs text-text-secondary mt-1">Weekly utilization percentage by team member</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-bg-secondary">
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">
                Team Member
              </th>
              {WEEKS.map((w) => (
                <th
                  key={w}
                  className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-text-muted w-24"
                >
                  {w}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.map((member) => (
              <tr key={member.name} className="transition-colors hover:bg-bg-secondary/50">
                <td className="px-6 py-3">
                  <p className="text-sm font-medium text-foreground">{member.name}</p>
                  <p className="text-xs text-text-muted">{member.role}</p>
                </td>
                {member.weeks.map((util, idx) => (
                  <td key={idx} className="px-4 py-3 text-center">
                    <div
                      className={`mx-auto flex h-10 w-16 items-center justify-center rounded-lg ${getUtilColor(util)}`}
                    >
                      <span className={`text-xs font-medium ${util > 75 ? 'text-white' : 'text-foreground'}`}>
                        {util}%
                      </span>
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="border-t border-border px-6 py-3 flex items-center gap-4">
        <span className="text-xs text-text-muted">Utilization:</span>
        {[
          { label: '0%', color: 'bg-gray-100' },
          { label: '25%', color: 'bg-green-100' },
          { label: '50%', color: 'bg-green-200' },
          { label: '75%', color: 'bg-green-400' },
          { label: '100%', color: 'bg-green-600' },
          { label: '>100%', color: 'bg-red-500' },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div className={`h-3 w-3 rounded ${item.color}`} />
            <span className="text-xs text-text-secondary">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
