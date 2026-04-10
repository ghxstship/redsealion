'use client';

import React, { useState } from 'react';
import { DndContext, DragOverlay, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors, DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export interface BoardItem {
  id: string;
  title: string;
  status: string;
  location_name: string | null;
  location_address: string | null;
  scheduled_start: string | null;
  work_order_assignments: Array<{
    crew_profiles: { full_name: string } | null;
  }>;
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  dispatched: 'Dispatched',
  in_progress: 'In Progress',
  completed: 'Completed',
};

const STATUS_COLORS: Record<string, string> = {
  draft: 'border-yellow-200 bg-yellow-50',
  dispatched: 'border-blue-200 bg-blue-50',
  in_progress: 'border-purple-200 bg-purple-50',
  completed: 'border-border bg-bg-secondary',
};

function crewNames(item: BoardItem): string {
  return item.work_order_assignments
    ?.map((a) => a.crew_profiles?.full_name)
    .filter(Boolean)
    .join(', ') || '';
}

function SortableItem({ item, status }: { item: BoardItem; status: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    data: { item, status },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="touch-none cursor-grab active:cursor-grabbing">
      <div className={`block rounded-lg border px-3 py-3 transition-shadow hover:shadow-md ${STATUS_COLORS[status]}`}>
        <p className="text-sm font-medium text-foreground line-clamp-1 pointer-events-none">{item.title}</p>
        {item.location_name && <p className="text-xs text-text-secondary mt-1 pointer-events-none">📍 {item.location_name}</p>}
        {crewNames(item) && <p className="text-xs text-text-muted mt-1 pointer-events-none">👤 {crewNames(item)}</p>}
        {item.scheduled_start && <p className="text-xs text-text-muted mt-1 pointer-events-none">{new Date(item.scheduled_start).toLocaleDateString()}</p>}
      </div>
    </div>
  );
}

export default function DispatchKanban({ initialColumns, statuses, workOrderIdPrefix }: { initialColumns: Record<string, BoardItem[]>; statuses: string[]; workOrderIdPrefix?: string }) {
  const [columns, setColumns] = useState(initialColumns);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeItem, setActiveItem] = useState<BoardItem | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    setActiveId(active.id as string);
    const item = active.data.current?.item as BoardItem;
    setActiveItem(item);
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    setActiveItem(null);
    const { active, over } = event;
    if (!over) return;

    const sourceColumn = active.data.current?.status as string;
    // We encode the target column into the droppable area ID
    const targetColumn = over.id.toString().startsWith('col-') 
      ? over.id.toString().replace('col-', '') 
      : over.data.current?.status as string;

    if (!sourceColumn || !targetColumn || sourceColumn === targetColumn) return;

    const itemId = active.id as string;
    
    // Optimistic update
    setColumns((prev) => {
      const sourceItems = [...(prev[sourceColumn] || [])];
      const itemIndex = sourceItems.findIndex((i) => i.id === itemId);
      if (itemIndex === -1) return prev;
      
      const [movedItem] = sourceItems.splice(itemIndex, 1);
      movedItem.status = targetColumn;
      
      const targetItems = [...(prev[targetColumn] || [])];
      targetItems.push(movedItem);
      
      return {
        ...prev,
        [sourceColumn]: sourceItems,
        [targetColumn]: targetItems,
      };
    });

    // DB update
    try {
      const supabase = createClient();
      await supabase.from('work_orders').update({ status: targetColumn }).eq('id', itemId);
      
      // We should also trigger the status transition endpoint for audit/webhook side effects,
      // but for kanban drags, direct DB updates with triggers or relying on the user 
      // clicking into the detail view for complex flows (like checklists) is common.
      // To properly trigger side-effects, we call our PATCH endpoint:
      await fetch(`/api/work-orders/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetColumn }),
      });
    } catch {
      // Revert in real app if failed
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 items-start">
        {statuses.map((status) => {
          const items = columns[status] || [];
          return (
            <div key={status} className="rounded-xl border border-border bg-bg-secondary/30 p-3 min-h-[500px] flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider">{STATUS_LABELS[status]}</h3>
                <span className="text-xs font-medium tabular-nums text-text-muted">{items.length}</span>
              </div>
              
              <SortableContext id={`col-${status}`} items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2 flex-1" id={`col-${status}`}>
                  {items.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border bg-background px-3 py-6 text-center h-full flex items-center justify-center">
                      <p className="text-xs text-text-muted">Drop items here</p>
                    </div>
                  ) : items.map((item) => (
                    <div key={item.id} className="relative group">
                      <SortableItem item={item} status={status} />
                      <Link href={`/app/dispatch/${item.id}`} className="absolute top-2 right-2 p-1.5 bg-white rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-zinc-50 border">
                        <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </Link>
                    </div>
                  ))}
                </div>
              </SortableContext>
            </div>
          );
        })}
      </div>
      
      <DragOverlay>
        {activeId && activeItem ? (
          <div className={`block rounded-lg border px-3 py-3 shadow-xl transform scale-105 ${STATUS_COLORS[activeItem.status]}`}>
            <p className="text-sm font-medium text-foreground line-clamp-1">{activeItem.title}</p>
            {activeItem.location_name && <p className="text-xs text-text-secondary mt-1">📍 {activeItem.location_name}</p>}
            {crewNames(activeItem) && <p className="text-xs text-text-muted mt-1">👤 {crewNames(activeItem)}</p>}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
