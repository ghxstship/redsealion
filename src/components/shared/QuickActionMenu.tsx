'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Plus, 
  FileText, 
  Briefcase, 
  UserPlus, 
  FileInput, 
  CheckSquare, 
  Package, 
  Receipt, 
  Clock,
  CalendarCheck,
  Zap,
  MapPin,
} from 'lucide-react';
import { useGlobalModals, type GlobalModalType } from './GlobalModalProvider';

/* ─────────────────────────────────────────────────────────
   Quick-action items
   ───────────────────────────────────────────────────────── */

interface QuickAction {
  label: string;
  icon: React.ReactNode;
  href?: string;
  modal?: GlobalModalType;
}

const quickActions: QuickAction[] = [
  {
    label: 'New Proposal',
    href: '/app/proposals/new',
    icon: <FileText size={16} className="text-text-muted" />,
  },
  {
    label: 'New Deal',
    modal: 'deal',
    icon: <Briefcase size={16} className="text-text-muted" />,
  },
  {
    label: 'New Client',
    modal: 'client',
    icon: <UserPlus size={16} className="text-text-muted" />,
  },
  {
    label: 'New Lead',
    modal: 'lead',
    icon: <FileInput size={16} className="text-text-muted" />,
  },
  {
    label: 'New Task',
    modal: 'task',
    icon: <CheckSquare size={16} className="text-text-muted" />,
  },
  {
    label: 'New Equipment',
    modal: 'equipment',
    icon: <Package size={16} className="text-text-muted" />,
  },
  {
    label: 'New Event',
    modal: 'event',
    icon: <CalendarCheck size={16} className="text-text-muted" />,
  },
  {
    label: 'New Activation',
    modal: 'activation',
    icon: <Zap size={16} className="text-text-muted" />,
  },
  {
    label: 'New Location',
    modal: 'location',
    icon: <MapPin size={16} className="text-text-muted" />,
  },
  {
    label: 'New Invoice',
    href: '/app/invoices/new',
    icon: <Receipt size={16} className="text-text-muted" />,
  },
  {
    label: 'Log Time',
    href: '/app/time/timer',
    icon: <Clock size={16} className="text-text-muted" />,
  },
];

/* ─────────────────────────────────────────────────────────
   Component
   ───────────────────────────────────────────────────────── */

export default function QuickActionMenu() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const { openModal } = useGlobalModals();

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  return (
    <div ref={panelRef} className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center justify-center w-9 h-9 rounded-lg transition-colors hover:bg-bg-secondary"
        aria-label="Quick actions"
        id="quick-action-trigger"
      >
        <Plus size={18} className="text-text-secondary" />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-border bg-background shadow-lg animate-scale-in overflow-hidden z-50">
          <p className="px-4 pt-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
            Create
          </p>
          <div className="py-1">
            {quickActions.map((action) => {
              const content = (
                <>
                  {action.icon}
                  {action.label}
                </>
              );
              
              if (action.href) {
                return (
                  <Link
                    key={action.label}
                    href={action.href}
                    onClick={() => setOpen(false)}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-left transition-colors hover:bg-bg-secondary text-text-secondary hover:text-foreground"
                  >
                    {content}
                  </Link>
                );
              }

              return (
                <button
                  key={action.label}
                  onClick={() => {
                    setOpen(false);
                    if (action.modal) openModal(action.modal);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-left transition-colors hover:bg-bg-secondary text-text-secondary hover:text-foreground"
                >
                  {content}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
