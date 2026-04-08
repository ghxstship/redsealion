'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ShareDialog from '@/components/shared/ShareDialog';
import ConfirmDialog from '@/components/shared/ConfirmDialog';

interface TaskDetailActionsProps {
  taskId: string;
  taskTitle: string;
}

export default function TaskDetailActions({ taskId, taskTitle }: TaskDetailActionsProps) {
  const router = useRouter();
  const [showShare, setShowShare] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  async function handleDelete() {
    const res = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete');
    router.push('/app/tasks');
    router.refresh();
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowShare(true)}
          className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-bg-secondary"
        >
          Share
        </button>
        <button
          onClick={() => setShowDelete(true)}
          className="rounded-lg border border-red-200 bg-background px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
        >
          Delete
        </button>
      </div>

      <ShareDialog open={showShare} onClose={() => setShowShare(false)} entityType="tasks" entityId={taskId} entityName={taskTitle} />
      <ConfirmDialog
        open={showDelete}
        title="Delete Task"
        message={`Are you sure you want to delete "${taskTitle}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />
    </>
  );
}
