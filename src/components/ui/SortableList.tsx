'use client';

/**
 * SortableList — Generic drag-and-drop reorderable list.
 *
 * Uses @dnd-kit/sortable to provide smooth reordering with keyboard
 * accessibility. Works with any item that has an `id: string` property.
 *
 * @module components/ui/SortableList
 */

import { useState, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

/* ─── Types ──────────────────────────────────────────────── */

interface SortableItemBase {
  id: string;
}

interface SortableListProps<T extends SortableItemBase> {
  items: T[];
  onReorder: (items: T[]) => void;
  renderItem: (item: T, index: number) => React.ReactNode;
  /** Optional class applied to the outer container */
  className?: string;
}

/* ─── Sortable Item Wrapper ──────────────────────────────── */

function SortableItem<T extends SortableItemBase>({
  item,
  index,
  renderItem,
}: {
  item: T;
  index: number;
  renderItem: (item: T, index: number) => React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative flex items-start gap-1 ${
        isDragging ? 'z-50 opacity-80 shadow-lg rounded-lg bg-background' : ''
      }`}
    >
      {/* Drag handle */}
      <button
        type="button"
        className="mt-3 flex-shrink-0 p-1 cursor-grab active:cursor-grabbing text-text-muted hover:text-text-secondary transition-colors touch-none"
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
      >
        <GripVertical size={14} />
      </button>

      {/* Item content */}
      <div className="flex-1 min-w-0">{renderItem(item, index)}</div>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────── */

export default function SortableList<T extends SortableItemBase>({
  items,
  onReorder,
  renderItem,
  className,
}: SortableListProps<T>) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        onReorder(arrayMove(items, oldIndex, newIndex));
      }
    },
    [items, onReorder],
  );

  if (items.length === 0) return null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        <div className={className}>
          {items.map((item, index) => (
            <SortableItem
              key={item.id}
              item={item}
              index={index}
              renderItem={renderItem}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
