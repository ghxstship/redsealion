'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/shared/PageHeader';
import EventFormModal from '@/components/admin/events/EventFormModal';
import Button from '@/components/ui/Button';
import { CalendarPlus, Download, ChevronDown } from 'lucide-react';

export default function MyScheduleHeader() {
  const router = useRouter();
  const [showExportMenu, setShowExportMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
    }
    if (showExportMenu) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showExportMenu]);

  async function handleIcsExport() {
    setShowExportMenu(false);
    try {
      const res = await fetch('/api/my-schedule/export');
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'flytedeck-schedule.ics';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
  }

  return (
    <PageHeader
      title="My Schedule"
      subtitle="Your personal agenda — tasks, shifts, events, and deadlines in one view."
      actionLabel="New Event"
      actionIcon={<CalendarPlus size={16} />}
      renderModal={(props) => (
        <EventFormModal
          open={props.open}
          onClose={props.onClose}
          onCreated={() => {
            props.onCreated();
            router.refresh();
          }}
        />
      )}
    >
      {/* Export dropdown */}
      <div className="relative" ref={menuRef}>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowExportMenu(!showExportMenu)}
        >
          <Download size={14} className="mr-1.5" />
          Export
          <ChevronDown size={12} className="ml-1" />
        </Button>

        {showExportMenu && (
          <div className="absolute right-0 top-full mt-1 w-52 rounded-lg border border-border bg-background shadow-lg z-50 py-1 animate-in fade-in slide-in-from-top-1 duration-150">
            <button
              onClick={handleIcsExport}
              className="w-full px-3 py-2 text-left text-sm text-foreground hover:bg-bg-secondary transition-colors flex items-center gap-2"
            >
              <Download size={14} className="text-text-muted" />
              Download .ics file
            </button>
            <div className="border-t border-border my-1" />
            <p className="px-3 py-1.5 text-[11px] text-text-muted">
              Import the .ics file into Google Calendar, Outlook, or Apple Calendar.
            </p>
          </div>
        )}
      </div>
    </PageHeader>
  );
}
