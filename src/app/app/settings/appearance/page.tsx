'use client';

import { useState, useEffect } from 'react';

type Theme = 'light' | 'dark' | 'system';
type CalendarView = 'month' | 'week' | 'day';
type Density = 'comfortable' | 'compact';

const themeOptions: { value: Theme; label: string; icon: React.ReactNode }[] = [
  {
    value: 'light',
    label: 'Light',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
      </svg>
    ),
  },
  {
    value: 'dark',
    label: 'Dark',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
      </svg>
    ),
  },
  {
    value: 'system',
    label: 'System',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25A2.25 2.25 0 0 1 5.25 3h13.5A2.25 2.25 0 0 1 21 5.25Z" />
      </svg>
    ),
  },
];

export default function AppearanceSettingsPage() {
  const [theme, setTheme] = useState<Theme>('system');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [calendarView, setCalendarView] = useState<CalendarView>('month');
  const [density, setDensity] = useState<Density>('comfortable');
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/settings/appearance')
      .then((r) => r.json())
      .then((data) => {
        if (data.theme) setTheme(data.theme);
        if (typeof data.sidebar_collapsed === 'boolean') setSidebarCollapsed(data.sidebar_collapsed);
        if (data.default_calendar_view) setCalendarView(data.default_calendar_view);
        if (data.density) setDensity(data.density);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      await fetch('/api/settings/appearance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme,
          sidebar_collapsed: sidebarCollapsed,
          default_calendar_view: calendarView,
          density,
        }),
      });
    } finally {
      setSaving(false);
    }
  }

  if (!loaded) return null;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Appearance</h2>
        <p className="mt-1 text-sm text-text-secondary">Customize how FlyteDeck looks for you.</p>
      </div>

      {/* Theme */}
      <div className="rounded-xl border border-border bg-white px-6 py-6">
        <h3 className="text-sm font-semibold text-foreground mb-5">Theme</h3>
        <div className="grid grid-cols-3 gap-4">
          {themeOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setTheme(opt.value)}
              className={`flex flex-col items-center gap-2 rounded-xl border-2 px-4 py-5 transition-[color,background-color,border-color,opacity,box-shadow] ${
                theme === opt.value
                  ? 'border-foreground ring-2 ring-foreground/10'
                  : 'border-border hover:border-foreground/30'
              }`}
            >
              <span className="text-foreground">{opt.icon}</span>
              <span className="text-sm font-medium text-foreground">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Sidebar */}
      <div className="rounded-xl border border-border bg-white px-6 py-6">
        <h3 className="text-sm font-semibold text-foreground mb-5">Sidebar</h3>
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-sm text-foreground">Collapse sidebar by default</span>
          <button
            type="button"
            role="switch"
            aria-checked={sidebarCollapsed}
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-normal ${
              sidebarCollapsed ? 'bg-foreground' : 'bg-gray-200'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-normal ${
                sidebarCollapsed ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </label>
      </div>

      {/* Calendar */}
      <div className="rounded-xl border border-border bg-white px-6 py-6">
        <h3 className="text-sm font-semibold text-foreground mb-5">Calendar</h3>
        <div>
          <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5">
            Default View
          </label>
          <select
            value={calendarView}
            onChange={(e) => setCalendarView(e.target.value as CalendarView)}
            className="w-full rounded-lg border border-border bg-white px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20"
          >
            <option value="month">Month</option>
            <option value="week">Week</option>
            <option value="day">Day</option>
          </select>
        </div>
      </div>

      {/* Density */}
      <div className="rounded-xl border border-border bg-white px-6 py-6">
        <h3 className="text-sm font-semibold text-foreground mb-5">Density</h3>
        <div className="space-y-3">
          {(['comfortable', 'compact'] as const).map((opt) => (
            <label key={opt} className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="density"
                value={opt}
                checked={density === opt}
                onChange={() => setDensity(opt)}
                className="h-4 w-4 border-border text-foreground focus:ring-foreground/10"
              />
              <span className="text-sm text-foreground capitalize">{opt}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-foreground px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-foreground/90 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
