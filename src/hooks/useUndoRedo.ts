'use client';

/**
 * Undo/Redo stack — hook for reversible operations.
 *
 * Usage:
 *   const { canUndo, canRedo, push, undo, redo } = useUndoRedo<TaskPatch>();
 *   push({ id: task.id, prev: { status: 'todo' }, next: { status: 'done' } });
 *   undo(); // restores previous state
 *   redo(); // re-applies the change
 *
 * @module hooks/useUndoRedo
 */

import { useState, useCallback } from 'react';

interface UndoEntry<T> {
  prev: T;
  next: T;
  description?: string;
}

interface UseUndoRedoReturn<T> {
  canUndo: boolean;
  canRedo: boolean;
  undoDescription: string | undefined;
  redoDescription: string | undefined;
  push: (entry: UndoEntry<T>) => void;
  undo: () => UndoEntry<T> | null;
  redo: () => UndoEntry<T> | null;
  clear: () => void;
}

export function useUndoRedo<T>(maxHistory = 50): UseUndoRedoReturn<T> {
  const [undoStack, setUndoStack] = useState<UndoEntry<T>[]>([]);
  const [redoStack, setRedoStack] = useState<UndoEntry<T>[]>([]);

  const push = useCallback(
    (entry: UndoEntry<T>) => {
      setUndoStack((prev) => {
        const next = [...prev, entry];
        return next.length > maxHistory ? next.slice(-maxHistory) : next;
      });
      setRedoStack([]); // Clear redo on new action
    },
    [maxHistory],
  );

  const undo = useCallback((): UndoEntry<T> | null => {
    let entry: UndoEntry<T> | null = null;
    setUndoStack((prev) => {
      if (prev.length === 0) return prev;
      entry = prev[prev.length - 1];
      return prev.slice(0, -1);
    });
    if (entry) {
      setRedoStack((prev) => [...prev, entry!]);
    }
    return entry;
  }, []);

  const redo = useCallback((): UndoEntry<T> | null => {
    let entry: UndoEntry<T> | null = null;
    setRedoStack((prev) => {
      if (prev.length === 0) return prev;
      entry = prev[prev.length - 1];
      return prev.slice(0, -1);
    });
    if (entry) {
      setUndoStack((prev) => [...prev, entry!]);
    }
    return entry;
  }, []);

  const clear = useCallback(() => {
    setUndoStack([]);
    setRedoStack([]);
  }, []);

  return {
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
    undoDescription: undoStack[undoStack.length - 1]?.description,
    redoDescription: redoStack[redoStack.length - 1]?.description,
    push,
    undo,
    redo,
    clear,
  };
}
