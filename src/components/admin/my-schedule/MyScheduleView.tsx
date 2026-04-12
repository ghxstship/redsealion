'use client';

import React, { useState, useMemo } from 'react';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import { Calendar, Clock, MapPin, Search } from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';
import FilterPills from '@/components/ui/FilterPills';
import FormInput from '@/components/ui/FormInput';
import Button from '@/components/ui/Button';

export type ScheduleItemType = 'shift' | 'task' | 'block';

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
}

interface MyScheduleViewProps {
  items: ScheduleItem[];
}

const SCHEDULE_TYPE_COLORS: Record<string, string> = {
  shift: 'bg-green-50 text-green-700',
  task: 'bg-amber-50 text-amber-700',
  block: 'bg-blue-50 text-blue-700',
};

export default function MyScheduleView({ items }: MyScheduleViewProps) {
  const [filterType, setFilterType] = useState<string>('all');
  const [search, setSearch] = useState('');

  const filterOptions = [
    { label: 'All', key: 'all' },
    { label: 'Shifts', key: 'shift' },
    { label: 'Tasks', key: 'task' },
    { label: 'Blocks', key: 'block' },
  ];

  const filteredItems = useMemo(() => {
    let filtered = items;
    if (filterType !== 'all') {
      filtered = filtered.filter((i) => i.type === filterType);
    }
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter((i) => 
        i.title.toLowerCase().includes(s) || 
        (i.subtitle && i.subtitle.toLowerCase().includes(s))
      );
    }
    
    // Sort ascending by start time
    return filtered.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  }, [items, filterType, search]);

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<Calendar className="w-8 h-8" />}
        message="No upcoming schedule items"
        description="Check back as events, tasks, and shifts are assigned to you."
      />
    );
  }

  // Group by day for simple list view
  const groupedTasks: Record<string, ScheduleItem[]> = {};
  filteredItems.forEach(item => {
    const d = new Date(item.start);
    const dateStr = d.toLocaleDateString();
    if (!groupedTasks[dateStr]) groupedTasks[dateStr] = [];
    groupedTasks[dateStr].push(item);
  });

  return (
    <div className="space-y-6">
      <Card className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <FilterPills
          items={filterOptions}
          activeKey={filterType}
          onChange={setFilterType}
        />
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
          <FormInput
            type="text"
            placeholder="Search schedule..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-border bg-background py-2 pl-9 pr-4 text-sm focus:border-interactive focus:outline-none focus:ring-1 focus:ring-interactive"
          />
        </div>
      </Card>

      {Object.keys(groupedTasks).length === 0 ? (
        <Card className="p-8 text-center text-text-muted">No items match your filters.</Card>
      ) : (
        Object.entries(groupedTasks).map(([dateLabel, dayItems]) => (
          <div key={dateLabel}>
            <h3 className="mb-4 text-lg font-semibold text-foreground sticky top-0 py-2 bg-background z-10 border-b border-border">
              {dateLabel}
            </h3>
            <div className="space-y-3">
              {dayItems.map(item => (
                <Card key={item.id} className="p-4 hover:border-interactive transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <StatusBadge 
                          status={item.type}
                          colorMap={SCHEDULE_TYPE_COLORS}
                        />
                        <h4 className="font-medium text-foreground text-base">
                          {item.title}
                        </h4>
                      </div>
                      {item.subtitle && (
                        <p className="text-sm text-text-muted">{item.subtitle}</p>
                      )}
                    </div>
                    
                    <div className="flex flex-col space-y-1 text-sm text-text-secondary sm:text-right">
                      <div className="flex items-center space-x-1 sm:justify-end">
                        <Clock size={14} />
                        <span>
                          {new Date(item.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {item.end && ` - ${new Date(item.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                        </span>
                      </div>
                      {item.location && (
                        <div className="flex items-center space-x-1 sm:justify-end">
                          <MapPin size={14} />
                          <span>{item.location}</span>
                        </div>
                      )}
                      {item.type === 'shift' && item.status === 'offered' && (
                        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border sm:justify-end">
                          <Button
                            onClick={async () => {
                              const id = item.id.replace('booking-', '');
                              await fetch(`/api/crew-bookings/${id}/respond`, { method: 'POST', body: JSON.stringify({ response: 'declined' }), headers: { 'Content-Type': 'application/json' } });
                              window.location.reload();
                            }}
                            className="px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 rounded"
                          >
                            Decline
                          </Button>
                          <Button
                            onClick={async () => {
                              const id = item.id.replace('booking-', '');
                              await fetch(`/api/crew-bookings/${id}/respond`, { method: 'POST', body: JSON.stringify({ response: 'accepted' }), headers: { 'Content-Type': 'application/json' } });
                              window.location.reload();
                            }}
                            className="px-3 py-1 text-xs font-medium bg-green-600 text-white hover:bg-green-700 rounded"
                          >
                            Accept Shift
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
