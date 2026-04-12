'use client';

import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { PhaseStatus } from '@/types/database';
import { IconCheck } from '@/components/ui/Icons';
import Button from '@/components/ui/Button';

interface TimelinePhase {
  id: string;
  phase_number: string;
  name: string;
  status: PhaseStatus;
}

interface JourneyTimelineProps {
  phases: TimelinePhase[];
  currentPhaseId: string | null;
}

export default function JourneyTimeline({
  phases,
  currentPhaseId,
}: JourneyTimelineProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (activeRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const el = activeRef.current;
      const offset =
        el.offsetLeft - container.offsetWidth / 2 + el.offsetWidth / 2;
      container.scrollTo({ left: offset, behavior: 'smooth' });
    }
  }, [currentPhaseId]);

  const isComplete = (status: PhaseStatus) =>
    status === 'complete' || status === 'approved';

  const isCurrent = (phase: TimelinePhase) => phase.id === currentPhaseId;

  const scrollToPhase = (phaseId: string) => {
    const el = document.getElementById(`phase-${phaseId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="sticky top-16 z-30 bg-background/90 backdrop-blur-md border-b border-border">
      <div
        ref={scrollRef}
        className="flex items-center gap-1 overflow-x-auto scrollbar-none px-6 lg:px-8 py-3 max-w-6xl mx-auto lg:max-w-[calc(100vw-24rem)]"
        style={{ scrollbarWidth: 'none' }}
      >
        {phases.map((phase, index) => {
          const active = isCurrent(phase);
          const complete = isComplete(phase.status);

          return (
            <div key={phase.id} className="flex items-center shrink-0">
              <Button
                ref={active ? activeRef : undefined}
                type="button"
                onClick={() => scrollToPhase(phase.id)}
                className={[
                  'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-[color,background-color,opacity] duration-slow whitespace-nowrap',
                  active
                    ? 'text-white'
                    : complete
                      ? 'bg-milestone/10 text-milestone'
                      : 'bg-transparent text-text-muted hover:text-text-secondary hover:bg-bg-secondary',
                ].join(' ')}
                style={active ? { backgroundColor: 'var(--org-primary)' } : undefined}
              >
                {/* Phase circle */}
                <span
                  className={[
                    'h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0',
                    active
                      ? 'bg-background/20 text-white'
                      : complete
                        ? 'bg-milestone text-white'
                        : 'bg-bg-tertiary text-text-muted',
                  ].join(' ')}
                >
                  {complete ? (
                    <IconCheck className="h-3 w-3" strokeWidth={2} />
                  ) : (
                    phase.phase_number
                  )}
                </span>
                <span className="hidden sm:inline">{phase.name}</span>
              </Button>

              {/* Connector */}
              {index < phases.length - 1 && (
                <div
                  className={[
                    'w-6 h-px mx-0.5 shrink-0',
                    complete ? 'bg-milestone' : 'bg-border',
                  ].join(' ')}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
