import { TierGate } from '@/components/shared/TierGate';

export default function CapacityPage() {
  const mockCapacity = [
    { name: 'Sarah Chen', role: 'Designer', available: 6, allocated: 8, utilization: 133 },
    { name: 'Mike Johnson', role: 'Fabricator', available: 8, allocated: 6, utilization: 75 },
    { name: 'Emily Davis', role: 'PM', available: 8, allocated: 7, utilization: 88 },
    { name: 'Alex Kim', role: 'Installer', available: 8, allocated: 4, utilization: 50 },
    { name: 'Jordan Lee', role: 'Designer', available: 8, allocated: 8, utilization: 100 },
  ];

  return (
    <TierGate feature="resource_scheduling">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Team Capacity
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          View available hours and set capacity overrides.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-bg-secondary">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Role</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">Available (h/day)</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">Allocated (h/day)</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">Utilization</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {mockCapacity.map((member) => (
                <tr key={member.name} className="transition-colors hover:bg-bg-secondary/50">
                  <td className="px-6 py-3.5 text-sm font-medium text-foreground">{member.name}</td>
                  <td className="px-6 py-3.5 text-sm text-text-secondary">{member.role}</td>
                  <td className="px-6 py-3.5 text-right text-sm tabular-nums text-foreground">{member.available}h</td>
                  <td className="px-6 py-3.5 text-right text-sm tabular-nums text-foreground">{member.allocated}h</td>
                  <td className="px-6 py-3.5 text-right">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        member.utilization > 100
                          ? 'bg-red-50 text-red-700'
                          : member.utilization >= 80
                            ? 'bg-green-50 text-green-700'
                            : 'bg-yellow-50 text-yellow-700'
                      }`}
                    >
                      {member.utilization}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </TierGate>
  );
}
