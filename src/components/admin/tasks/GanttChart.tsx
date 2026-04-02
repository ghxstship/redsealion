'use client';

interface GanttTask {
  id: string;
  title: string;
  startCol: number;
  duration: number;
  color: string;
}

const WEEKS = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8'] as const;

const tasks: GanttTask[] = [
  { id: '1', title: 'Site survey', startCol: 0, duration: 1, color: 'bg-blue-400' },
  { id: '2', title: 'Design phase', startCol: 1, duration: 2, color: 'bg-indigo-400' },
  { id: '3', title: 'Client review', startCol: 3, duration: 1, color: 'bg-yellow-400' },
  { id: '4', title: 'Fabrication', startCol: 3, duration: 3, color: 'bg-green-400' },
  { id: '5', title: 'Content creation', startCol: 2, duration: 2, color: 'bg-purple-400' },
  { id: '6', title: 'Load-in', startCol: 6, duration: 1, color: 'bg-orange-400' },
  { id: '7', title: 'Activation', startCol: 7, duration: 1, color: 'bg-red-400' },
];

export default function GanttChart() {
  return (
    <div className="rounded-xl border border-border bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Header */}
          <div className="flex border-b border-border bg-bg-secondary">
            <div className="w-48 flex-shrink-0 px-4 py-3 text-xs font-medium uppercase tracking-wider text-text-muted border-r border-border">
              Task
            </div>
            <div className="flex-1 flex">
              {WEEKS.map((w) => (
                <div
                  key={w}
                  className="flex-1 px-2 py-3 text-center text-xs font-medium uppercase tracking-wider text-text-muted border-r border-border last:border-r-0"
                >
                  {w}
                </div>
              ))}
            </div>
          </div>

          {/* Rows */}
          {tasks.map((task) => (
            <div key={task.id} className="flex border-b border-border last:border-b-0 hover:bg-bg-secondary/50 transition-colors">
              <div className="w-48 flex-shrink-0 px-4 py-3 text-sm font-medium text-foreground border-r border-border">
                {task.title}
              </div>
              <div className="flex-1 flex relative py-2">
                {WEEKS.map((w, idx) => (
                  <div key={w} className="flex-1 border-r border-border/30 last:border-r-0">
                    {idx === task.startCol && (
                      <div
                        className={`absolute h-6 rounded-md ${task.color} top-1/2 -translate-y-1/2`}
                        style={{
                          left: `${(task.startCol / WEEKS.length) * 100}%`,
                          width: `${(task.duration / WEEKS.length) * 100}%`,
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
