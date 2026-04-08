'use client';

import { useState, type ReactNode } from 'react';
import ModalShell from '@/components/ui/ModalShell';
import Button from '@/components/ui/Button';
import { AlignJustify, Menu, StretchHorizontal, Pin, GripVertical } from 'lucide-react';
import Tooltip from '@/components/ui/Tooltip';
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
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ColumnDef {
  key: string;
  label: string;
  visible: boolean;
  pinned: boolean;
}

interface ColumnConfigPanelProps {
  open: boolean;
  onClose: () => void;
  columns: ColumnDef[];
  onColumnsChange: (columns: ColumnDef[]) => void;
  rowHeight: 'compact' | 'default' | 'tall';
  onRowHeightChange: (height: 'compact' | 'default' | 'tall') => void;
}

const ROW_HEIGHT_OPTIONS: { key: 'compact' | 'default' | 'tall'; label: string; icon: ReactNode }[] = [
  { key: 'compact', label: 'Compact', icon: <AlignJustify size={13} /> },
  { key: 'default', label: 'Default', icon: <Menu size={13} /> },
  { key: 'tall', label: 'Tall', icon: <StretchHorizontal size={13} /> },
];

interface SortableColumnItemProps {
  col: ColumnDef;
  onToggleVisibility: (key: string) => void;
  onTogglePin: (key: string) => void;
}

function SortableColumnItem({ col, onToggleVisibility, onTogglePin }: SortableColumnItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: col.key });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
    position: isDragging ? ('relative' as const) : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 rounded-lg px-3 py-2 transition-colors ${
        isDragging ? 'bg-bg-secondary shadow-md' : 'hover:bg-bg-secondary bg-transparent'
      }`}
    >
      <div 
        {...attributes} 
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-text-muted hover:text-foreground touch-none mr-1"
      >
        <GripVertical size={14} />
      </div>
      <input
        type="checkbox"
        checked={col.visible}
        onChange={() => onToggleVisibility(col.key)}
        className="h-3.5 w-3.5 rounded border-border text-foreground focus:ring-foreground/10"
      />
      <span className="flex-1 text-sm text-foreground">{col.label}</span>
      <Tooltip label={col.pinned ? 'Unpin column' : 'Pin column'}>
        <button
          onClick={() => onTogglePin(col.key)}
          className={`transition-colors ${col.pinned ? 'text-blue-600' : 'text-text-muted hover:text-foreground'}`}
        >
          <Pin size={12} />
        </button>
      </Tooltip>
    </div>
  );
}

export default function ColumnConfigPanel({
  open,
  onClose,
  columns,
  onColumnsChange,
  rowHeight,
  onRowHeightChange,
}: ColumnConfigPanelProps) {
  const [localColumns, setLocalColumns] = useState(columns);

  function toggleVisibility(key: string) {
    setLocalColumns((prev) =>
      prev.map((c) => (c.key === key ? { ...c, visible: !c.visible } : c))
    );
  }

  function togglePin(key: string) {
    setLocalColumns((prev) =>
      prev.map((c) => (c.key === key ? { ...c, pinned: !c.pinned } : c))
    );
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setLocalColumns((items) => {
        const oldIndex = items.findIndex((i) => i.key === active.id);
        const newIndex = items.findIndex((i) => i.key === over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }

  function handleApply() {
    onColumnsChange(localColumns);
    onClose();
  }

  function handleReset() {
    setLocalColumns(columns.map((c) => ({ ...c, visible: true, pinned: false })));
  }

  return (
    <ModalShell open={open} onClose={onClose} title="Column Settings" size="sm" sectioned>
      <div className="px-5 py-4 max-h-[60vh] overflow-y-auto">
        {/* Row height */}
        <div className="mb-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted mb-2">Row Height</p>
          <div className="flex gap-1 rounded-lg border border-border p-1 bg-bg-secondary">
            {ROW_HEIGHT_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => onRowHeightChange(opt.key)}
                title={opt.label}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  rowHeight === opt.key ? 'bg-background text-foreground shadow-sm' : 'text-text-muted hover:text-foreground'
                }`}
              >
                {opt.icon} {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Column list */}
        <p className="text-xs font-medium uppercase tracking-wider text-text-muted mb-2">Columns</p>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={localColumns.map((c) => c.key)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-1">
              {localColumns.map((col) => (
                <SortableColumnItem
                  key={col.key}
                  col={col}
                  onToggleVisibility={toggleVisibility}
                  onTogglePin={togglePin}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      <div className="flex items-center justify-between px-5 py-4 border-t border-border">
        <button onClick={handleReset} className="text-xs font-medium text-text-muted hover:text-foreground transition-colors">
          Reset to defaults
        </button>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={handleApply}>Apply</Button>
        </div>
      </div>
    </ModalShell>
  );
}
