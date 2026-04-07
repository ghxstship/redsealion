'use client';

/**
 * CopilotTrigger — header icon button to toggle the AI copilot panel.
 *
 * Also registers the global ⌘J keyboard shortcut.
 *
 * @module components/shared/CopilotTrigger
 */

import { useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { useCopilot } from './CopilotProvider';

export default function CopilotTrigger() {
  const { toggle, isOpen } = useCopilot();

  // ⌘J / Ctrl+J keyboard shortcut
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
        e.preventDefault();
        toggle();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [toggle]);

  return (
    <button
      onClick={toggle}
      className={`relative flex items-center justify-center w-9 h-9 rounded-lg transition-colors ${
        isOpen
          ? 'bg-amber-50 text-amber-600'
          : 'hover:bg-bg-secondary text-text-secondary'
      }`}
      aria-label="AI Copilot (⌘J)"
      title="AI Copilot (⌘J)"
      id="copilot-trigger"
    >
      <Sparkles size={18} />

      {/* Active indicator dot */}
      {isOpen && (
        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-amber-500" />
      )}
    </button>
  );
}
