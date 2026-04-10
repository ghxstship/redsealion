'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import Link from 'next/link';
import GoalDialog from './GoalDialog';
import KeyResultForm from './KeyResultForm';
import CheckInDialog from './CheckInDialog';
import { deleteGoal, deleteKeyResult } from './actions';

interface Goal {
  id: string;
  title: string;
  description: string | null;
  status: string;
  progress: number;
  due_date: string | null;
  start_date: string | null;
  category: string;
  key_results: KeyResult[];
}

interface KeyResult {
  id: string;
  title: string;
  target: number;
  current: number;
  start_value: number;
  unit: string;
}

interface GoalsPageClientProps {
  goals: Goal[];
}

function statusBadge(status: string): string {
  const map: Record<string, string> = {
    on_track: 'bg-green-100 text-green-700',
    at_risk: 'bg-amber-100 text-amber-700',
    off_track: 'bg-red-100 text-red-700',
    completed: 'bg-blue-100 text-blue-700',
  };
  return map[status] ?? 'bg-bg-secondary text-text-muted';
}

export default function GoalsPageClient({ goals }: GoalsPageClientProps) {
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  const [activeCheckInGoal, setActiveCheckInGoal] = useState<{ id: string; title: string; progress: number } | null>(null);
  const [activeKrGoalId, setActiveKrGoalId] = useState<string | null>(null);

  function openCreateGoal() {
    setEditingGoal(null);
    setIsGoalDialogOpen(true);
  }

  function openEditGoal(g: Goal) {
    setEditingGoal(g);
    setIsGoalDialogOpen(true);
  }

  async function handleDeleteGoal(id: string) {
    if (confirm('Are you sure you want to delete this goal?')) {
      await deleteGoal(id);
    }
  }

  async function handleDeleteKr(id: string) {
    if (confirm('Delete this key result?')) {
      await deleteKeyResult(id);
    }
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          {/* Header is handled in page.tsx */}
        </div>
        <Button onClick={openCreateGoal}>New Goal</Button>
      </div>

      <div className="space-y-6">
        {goals.map((goal) => (
          <div key={goal.id} className="rounded-xl border border-border bg-background p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-foreground">{goal.title}</h3>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusBadge(goal.status)}`}>
                    {goal.status.replace(/_/g, ' ')}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                    {goal.category}
                  </span>
                </div>
                {goal.description && <p className="text-xs text-text-secondary">{goal.description}</p>}
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-text-muted flex-shrink-0">
                  {goal.start_date || '?'} to {goal.due_date || '?'}
                </span>
                <button onClick={() => openEditGoal(goal)} className="text-xs text-blue-600 hover:underline">Edit</button>
                <button onClick={() => handleDeleteGoal(goal.id)} className="text-xs text-red-600 hover:underline">Delete</button>
              </div>
            </div>

            <div className="mb-5 flex items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-text-muted">Overall Progress</span>
                  <span className="text-xs font-medium tabular-nums text-foreground">{goal.progress}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-bg-secondary overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      goal.progress >= 80 ? 'bg-green-500' : goal.progress >= 50 ? 'bg-blue-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${goal.progress}%` }}
                  />
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setActiveCheckInGoal({ id: goal.id, title: goal.title, progress: goal.progress })}>
                Check In
              </Button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-medium uppercase tracking-wider text-text-muted">Key Results</h4>
                <button onClick={() => setActiveKrGoalId(goal.id)} className="text-xs text-blue-600 hover:underline">
                  + Add Key Result
                </button>
              </div>

              {goal.key_results.map((kr) => {
                // Correct progress logic using start_value
                const range = kr.target - kr.start_value;
                const completed = kr.current - kr.start_value;
                const rawPct = range === 0 ? (kr.current >= kr.target ? 100 : 0) : (completed / range) * 100;
                const pct = Math.max(0, Math.min(Math.round(rawPct), 100));

                return (
                  <div key={kr.id} className="flex items-center gap-4 bg-bg-secondary/50 p-2 rounded-md">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">{kr.title}</p>
                    </div>
                    <div className="w-24 h-1.5 rounded-full bg-bg-secondary overflow-hidden flex-shrink-0">
                      <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs tabular-nums text-text-secondary w-32 text-right flex-shrink-0">
                      {kr.current}{kr.unit} / {kr.target}{kr.unit} ({pct}%)
                    </span>
                    <button onClick={() => handleDeleteKr(kr.id)} className="text-xs text-text-muted hover:text-red-500">×</button>
                  </div>
                );
              })}
              {goal.key_results.length === 0 && (
                <div className="text-xs text-text-muted italic">No key results defined yet.</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {goals.length === 0 && (
        <EmptyState
          message="No goals created yet"
          description="Create goals and key results to track your team's progress."
        />
      )}

      {/* Modals */}
      <GoalDialog
        isOpen={isGoalDialogOpen}
        onClose={() => setIsGoalDialogOpen(false)}
        goal={editingGoal}
      />
      
      {activeKrGoalId && (
        <KeyResultForm
          goalId={activeKrGoalId}
          isOpen={true}
          onClose={() => setActiveKrGoalId(null)}
        />
      )}

      {activeCheckInGoal && (
        <CheckInDialog
          goal={activeCheckInGoal}
          isOpen={true}
          onClose={() => setActiveCheckInGoal(null)}
        />
      )}

      <div className="mt-6 text-center">
        <Link href="/app/tasks" className="text-sm font-medium text-text-muted hover:text-foreground transition-colors">
          ← Back to Tasks
        </Link>
      </div>
    </>
  );
}
