'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import {
  Calendar, Clock, MapPin, Search, ChevronLeft, ChevronRight,
  ExternalLink, Flag, Milestone, CalendarDays, Briefcase, Layers,
} from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';
import { Badge } from '@/components/ui/Badge';
import FilterPills from '@/components/ui/FilterPills';
import Button from '@/components/ui/Button';
import MiniCalendar from './MiniCalendar';
import { generateGoogleCalendarUrl, type ICalEvent } from '@/lib/utils/ical';

export type ScheduleItemType = 'shift' | 'task' | 'block' | 'event' | 'milestone' | 'deadline';

export interface ScheduleItem {
  id: string;
  type: ScheduleItemType;
  title: string;
  subtitle?: string;
  start: string; // ISO date string
  end?: string; // ISO date string
  location?: string;
  href?: string;
  status?: string;
  allDay?: boolean;
}

interface MyScheduleViewProps {
  items: ScheduleItem[];
}

/* ─── Type Configuration ────────────────────────────────────── */

const TYPE_CONFIG: Record<ScheduleItemType, {
  label: string;
  color: string;      // left border color
  bgColor: string;    // subtle background
  badgeColor: string; // StatusBadge colorMap
  icon: React.ReactNode;
}> = {
  task: {
    label: 'Task',
    color: 'border-l-amber-500',
    bgColor: 'hover:bg-amber-50/30 dark:hover:bg-amber-900/10',
    badgeColor: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    icon: <Briefcase size={13} />,
  },
  shift: {
    label: 'Shift',
    color: 'border-l-emerald-500',
    bgColor: 'hover:bg-emerald-50/30 dark:hover:bg-emerald-900/10',
    badgeColor: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    icon: <Clock size={13} />,
  },
  event: {
    label: 'Event',
    color: 'border-l-purple-500',
    bgColor: 'hover:bg-purple-50/30 dark:hover:bg-purple-900/10',
    badgeColor: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    icon: <CalendarDays size={13} />,
  },
  milestone: {
    label: 'Milestone',
    color: 'border-l-red-500',
    bgColor: 'hover:bg-red-50/30 dark:hover:bg-red-900/10',
    badgeColor: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    icon: <Milestone size={13} />,
  },
  block: {
    label: 'Block',
    color: 'border-l-blue-500',
    bgColor: 'hover:bg-blue-50/30 dark:hover:bg-blue-900/10',
    badgeColor: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    icon: <Layers size={13} />,
  },
  deadline: {
    label: 'Deadline',
    color: 'border-l-rose-600',
    bgColor: 'hover:bg-rose-50/30 dark:hover:bg-rose-900/10',
    badgeColor: 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
    icon: <Flag size={13} />,
  },
};

/* ─── Helpers ───────────────────────────────────────────────── */

function isoDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function isOverdue(item: ScheduleItem): boolean {
  const now = new Date();
  const end = item.end ? new Date(item.end) : new Date(item.start);
  return end < now && item.status !== 'done' && item.status !== 'completed';
}

function formatTimeRange(start: string, end?: string): string {
  const s = new Date(start);
  const fmt = (d: Date) => d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  if (!end) return fmt(s);
  return `${fmt(s)} – ${fmt(new Date(end))}`;
}

function formatDayHeader(date: Date, today: Date): string {
  if (isSameDay(date, today)) return 'Today';
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (isSameDay(date, tomorrow)) return 'Tomorrow';
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (isSameDay(date, yesterday)) return 'Yesterday';
  return date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
}

function toICalEvent(item: ScheduleItem): ICalEvent {
  return {
    uid: `${item.id}@flytedeck.app`,
    summary: item.title,
    description: item.subtitle,
    location: item.location,
    dtstart: new Date(item.start),
    dtend: item.end ? new Date(item.end) : undefined,
    allDay: item.allDay,
    categories: [TYPE_CONFIG[item.type].label],
  };
}

/* ─── Main Component ─────────────────────────────────────────── */

export default function MyScheduleView({ items }: MyScheduleViewProps) {
  const today = useMemo(() => new Date(), []);
  const [selectedDate, setSelectedDate] = useState(today);
  const [filterType, setFilterType] = useState<string>('all');
  const [search, setSearch] = useState('');
  const dayRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Build date → items map
  const datesWithItems = useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) => {
      const d = new Date(item.start);
      set.add(isoDateKey(d));
    });
    return set;
  }, [items]);

  // Filter items
  const filteredItems = useMemo(() => {
    let filtered = items;
    if (filterType !== 'all') {
      filtered = filtered.filter((i) => i.type === filterType);
    }
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(
        (i) =>
          i.title.toLowerCase().includes(s) ||
          (i.subtitle && i.subtitle.toLowerCase().includes(s)) ||
          (i.location && i.location.toLowerCase().includes(s)),
      );
    }
    return filtered.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  }, [items, filterType, search]);

  // Group by day
  const groupedByDay = useMemo(() => {
    const groups: Record<string, { date: Date; allDay: ScheduleItem[]; timed: ScheduleItem[] }> = {};
    filteredItems.forEach((item) => {
      const d = new Date(item.start);
      const key = isoDateKey(d);
      if (!groups[key]) {
        groups[key] = { date: new Date(d.getFullYear(), d.getMonth(), d.getDate()), allDay: [], timed: [] };
      }
      if (item.allDay) {
        groups[key].allDay.push(item);
      } else {
        groups[key].timed.push(item);
      }
    });
    return Object.entries(groups)
      .sort(([a], [b]) => a.localeCompare(b));
  }, [filteredItems]);

  // Filter options with counts
  const filterOptions = useMemo(() => {
    const counts: Record<string, number> = { all: items.length };
    items.forEach((item) => {
      counts[item.type] = (counts[item.type] ?? 0) + 1;
    });
    return [
      { label: 'All', key: 'all', count: counts.all },
      ...Object.entries(TYPE_CONFIG)
        .filter(([key]) => counts[key])
        .map(([key, cfg]) => ({ label: cfg.label, key, count: counts[key] })),
    ];
  }, [items]);

  // Scroll to selected date
  useEffect(() => {
    const key = isoDateKey(selectedDate);
    const el = dayRefs.current[key];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selectedDate]);

  // Overdue count
  const overdueCount = useMemo(() => filteredItems.filter(isOverdue).length, [filteredItems]);

  if (items.length === 0) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        <Card className="p-4 h-fit lg:sticky lg:top-4">
          <MiniCalendar
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            datesWithItems={datesWithItems}
          />
        </Card>
        <EmptyState
          icon={<Calendar className="w-8 h-8" />}
          message="No upcoming schedule items"
          description="Check back as events, tasks, shifts, and milestones are assigned to you."
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
      {/* Left sidebar */}
      <div className="space-y-4 lg:sticky lg:top-4 h-fit">
        <Card className="p-4">
          <MiniCalendar
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            datesWithItems={datesWithItems}
          />
        </Card>

        {/* Stats */}
        <Card className="p-4 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">Summary</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-secondary">Total items</span>
              <span className="font-semibold text-foreground">{items.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-secondary">Today</span>
              <span className="font-semibold text-foreground">
                {items.filter((i) => isSameDay(new Date(i.start), today)).length}
              </span>
            </div>
            {overdueCount > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-red-600">Overdue</span>
                <span className="font-semibold text-red-600">{overdueCount}</span>
              </div>
            )}
          </div>

          {/* Type breakdown */}
          <div className="pt-2 border-t border-border space-y-1.5">
            {Object.entries(TYPE_CONFIG).map(([type, cfg]) => {
              const count = items.filter((i) => i.type === type).length;
              if (count === 0) return null;
              return (
                <div key={type} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-text-secondary">
                    <span className={`w-2 h-2 rounded-full ${cfg.color.replace('border-l-', 'bg-')}`} />
                    {cfg.label}
                  </div>
                  <span className="font-medium text-text-secondary">{count}</span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Main agenda */}
      <div className="space-y-2">
        {/* Toolbar */}
        <Card className="p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <FilterPills
            items={filterOptions}
            activeKey={filterType}
            onChange={setFilterType}
          />
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
            <input
              type="text"
              placeholder="Search schedule..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-border bg-background py-1.5 pl-9 pr-3 text-sm text-foreground placeholder:text-text-muted focus:border-interactive focus:outline-none focus:ring-1 focus:ring-interactive transition-colors"
            />
          </div>
        </Card>

        {/* Day groups */}
        {groupedByDay.length === 0 ? (
          <Card className="p-8 text-center text-text-muted text-sm">
            No items match your filters.
          </Card>
        ) : (
          groupedByDay.map(([dateKey, { date, allDay, timed }]) => {
            const isToday = isSameDay(date, today);
            const isPast = date < today && !isToday;

            return (
              <div
                key={dateKey}
                ref={(el) => { dayRefs.current[dateKey] = el; }}
                className="scroll-mt-4"
              >
                {/* Day header */}
                <div className={`sticky top-0 z-10 flex items-center gap-3 py-2.5 px-1 bg-background/95 backdrop-blur-sm border-b border-border ${isPast ? 'opacity-60' : ''}`}>
                  <div className={`
                    flex items-center justify-center w-10 h-10 rounded-xl text-sm font-bold
                    ${isToday
                      ? 'bg-foreground text-background shadow-md'
                      : 'bg-bg-secondary text-text-secondary'
                    }
                  `}>
                    {date.getDate()}
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${isToday ? 'text-foreground' : 'text-text-secondary'}`}>
                      {formatDayHeader(date, today)}
                    </p>
                    <p className="text-[11px] text-text-muted">
                      {date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                      {' · '}
                      {allDay.length + timed.length} item{allDay.length + timed.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                {/* All-day items */}
                {allDay.length > 0 && (
                  <div className="ml-[52px] mt-1 space-y-1">
                    {allDay.map((item) => (
                      <AgendaItem key={item.id} item={item} isAllDay />
                    ))}
                  </div>
                )}

                {/* Timed items */}
                <div className="ml-[52px] mt-1 space-y-1 mb-4">
                  {timed.map((item) => (
                    <AgendaItem key={item.id} item={item} />
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

/* ─── Agenda Item Component ────────────────────────────────── */

function AgendaItem({ item, isAllDay }: { item: ScheduleItem; isAllDay?: boolean }) {
  const config = TYPE_CONFIG[item.type];
  const overdue = isOverdue(item);
  const gcalUrl = generateGoogleCalendarUrl(toICalEvent(item));

  return (
    <div
      className={`
        group relative flex items-start gap-3 rounded-lg border border-border/60
        pl-0 pr-3 py-2.5 transition-all duration-150
        border-l-[3px] ${config.color}
        ${config.bgColor}
        ${overdue ? 'bg-red-50/40 dark:bg-red-950/20 border-border/80' : ''}
      `}
    >
      {/* Time column */}
      <div className="w-[72px] flex-shrink-0 pl-3 pt-0.5">
        {isAllDay ? (
          <span className="text-[11px] font-medium text-text-muted uppercase tracking-wider">All day</span>
        ) : (
          <span className="text-xs font-medium text-text-secondary tabular-nums">
            {formatTimeRange(item.start, item.end)}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h4 className={`text-sm font-medium truncate ${overdue ? 'text-red-700 dark:text-red-400' : 'text-foreground'}`}>
                {item.href ? (
                  <a href={item.href} className="hover:underline">{item.title}</a>
                ) : (
                  item.title
                )}
              </h4>
              {overdue && (
                <Badge variant="error" className="uppercase tracking-wider">
                  Overdue
                </Badge>
              )}
            </div>
            {item.subtitle && (
              <p className="text-xs text-text-muted mt-0.5 truncate">{item.subtitle}</p>
            )}
            {item.location && (
              <div className="flex items-center gap-1 mt-1 text-xs text-text-muted">
                <MapPin size={11} />
                <span className="truncate">{item.location}</span>
              </div>
            )}
          </div>

          {/* Right side badges + actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <StatusBadge
              status={item.type}
              colorMap={Object.fromEntries(
                Object.entries(TYPE_CONFIG).map(([k, v]) => [k, v.badgeColor]),
              )}
            />
            <a
              href={gcalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-bg-secondary text-text-muted hover:text-foreground"
              title="Add to Google Calendar"
            >
              <ExternalLink size={13} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
