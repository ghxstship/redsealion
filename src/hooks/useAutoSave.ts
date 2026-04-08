/**
 * useAutoSave — Debounced auto-save hook for builder pages.
 *
 * Watches a data dependency and auto-persists after a debounce period.
 * Provides visual save status indicators and undo capability.
 *
 * @module hooks/useAutoSave
 */

import { useCallback, useEffect, useRef, useState } from 'react';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface UseAutoSaveOptions<T> {
  /** The data to watch for changes */
  data: T;
  /** Called to persist the data. Return true on success, false on failure. */
  onSave: (data: T) => Promise<boolean>;
  /** Debounce delay in ms (default: 2000) */
  debounceMs?: number;
  /** Whether auto-save is enabled (default: true) */
  enabled?: boolean;
}

interface UseAutoSaveReturn {
  /** Current save status */
  status: SaveStatus;
  /** Trigger an immediate save */
  saveNow: () => void;
  /** Number of unsaved changes since last successful persist */
  isDirty: boolean;
  /** Undo stack — restores previous data snapshots */
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const MAX_HISTORY = 50;

export function useAutoSave<T>({
  data,
  onSave,
  debounceMs = 2000,
  enabled = true,
}: UseAutoSaveOptions<T>): UseAutoSaveReturn {
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [isDirty, setIsDirty] = useState(false);

  // Undo/redo history
  const historyRef = useRef<T[]>([]);
  const historyIndexRef = useRef(-1);
  const isUndoRedoRef = useRef(false);

  // Track serialized snapshots
  const lastSavedRef = useRef<string>('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dataRef = useRef(data);
  dataRef.current = data;

  // Push to history on data change (but not from undo/redo)
  useEffect(() => {
    if (isUndoRedoRef.current) {
      isUndoRedoRef.current = false;
      return;
    }
    const serialized = JSON.stringify(data);
    if (serialized !== lastSavedRef.current) {
      setIsDirty(true);
      // Trim forward history
      historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
      historyRef.current.push(structuredClone(data));
      if (historyRef.current.length > MAX_HISTORY) {
        historyRef.current.shift();
      }
      historyIndexRef.current = historyRef.current.length - 1;
    }
  }, [data]);

  // Save function
  const performSave = useCallback(async () => {
    const current = dataRef.current;
    const serialized = JSON.stringify(current);

    if (serialized === lastSavedRef.current) {
      setIsDirty(false);
      return;
    }

    setStatus('saving');
    try {
      const ok = await onSave(current);
      if (ok) {
        lastSavedRef.current = serialized;
        setStatus('saved');
        setIsDirty(false);
        // Reset back to idle after brief flash
        setTimeout(() => setStatus('idle'), 2000);
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  }, [onSave]);

  // Debounced auto-save
  useEffect(() => {
    if (!enabled || !isDirty) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(performSave, debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isDirty, enabled, debounceMs, performSave]);

  // Initialize last saved ref
  useEffect(() => {
    if (lastSavedRef.current === '') {
      lastSavedRef.current = JSON.stringify(data);
      historyRef.current = [structuredClone(data)];
      historyIndexRef.current = 0;
    }
  }, [data]);

  const saveNow = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    performSave();
  }, [performSave]);

  const undo = useCallback(() => {
    if (historyIndexRef.current <= 0) return;
    isUndoRedoRef.current = true;
    historyIndexRef.current -= 1;
    // Caller must re-set state from returned data
  }, []);

  const redo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    isUndoRedoRef.current = true;
    historyIndexRef.current += 1;
  }, []);

  return {
    status,
    saveNow,
    isDirty,
    undo,
    redo,
    canUndo: historyIndexRef.current > 0,
    canRedo: historyIndexRef.current < historyRef.current.length - 1,
  };
}
