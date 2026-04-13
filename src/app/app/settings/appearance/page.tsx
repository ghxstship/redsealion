'use client';

import { Sun, Moon, Monitor } from 'lucide-react';
import { usePreferences } from '@/components/shared/PreferencesProvider';
import Button from '@/components/ui/Button';
import FormSelect from '@/components/ui/FormSelect';

import { RoleGate } from '@/components/shared/RoleGate';
type Theme = 'light' | 'dark' | 'system';
type CalendarView = 'month' | 'week' | 'day';
type Density = 'comfortable' | 'compact';

const themeOptions: { value: Theme; label: string; icon: React.ReactNode }[] = [
  {
    value: 'light',
    label: 'Light',
    icon: <Sun size={24} />,
  },
  {
    value: 'dark',
    label: 'Dark',
    icon: <Moon size={24} />,
  },
  {
    value: 'system',
    label: 'System',
    icon: <Monitor size={24} />,
  },
];

export default function AppearanceSettingsPage() {
  const prefs = usePreferences();

  async function handleSave() {
    await prefs.save();
  }

  if (!prefs.loaded) return null;

  return (
    <RoleGate>
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Appearance</h2>
        <p className="mt-1 text-sm text-text-secondary">Customize how FlyteDeck looks for you.</p>
      </div>

      {/* Theme */}
      <div className="rounded-xl border border-border bg-background px-6 py-6">
        <h3 className="text-sm font-semibold text-foreground mb-5">Theme</h3>
        <div className="grid grid-cols-3 gap-4">
          {themeOptions.map((opt) => (
            <Button
              key={opt.value}
              type="button"
              onClick={() => prefs.setTheme(opt.value)}
              className={`flex flex-col items-center gap-2 rounded-xl border-2 px-4 py-5 transition-[color,background-color,border-color,opacity,box-shadow] ${
                prefs.theme === opt.value
                  ? 'border-foreground ring-2 ring-foreground/10'
                  : 'border-border hover:border-foreground/30'
              }`}
            >
              <span className="text-foreground">{opt.icon}</span>
              <span className="text-sm font-medium text-foreground">{opt.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Sidebar */}
      <div className="rounded-xl border border-border bg-background px-6 py-6">
        <h3 className="text-sm font-semibold text-foreground mb-5">Sidebar</h3>
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-sm text-foreground">Collapse sidebar by default</span>
          <Button
            type="button"
            role="switch"
            aria-checked={prefs.sidebarCollapsed}
            onClick={() => prefs.setSidebarCollapsed(!prefs.sidebarCollapsed)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-normal ${
              prefs.sidebarCollapsed ? 'bg-foreground' : 'bg-bg-tertiary'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow ring-0 transition duration-normal ${
                prefs.sidebarCollapsed ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </Button>
        </label>
      </div>

      {/* Calendar */}
      <div className="rounded-xl border border-border bg-background px-6 py-6">
        <h3 className="text-sm font-semibold text-foreground mb-5">Calendar</h3>
        <div>
          <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5">
            Default View
          </label>
          <FormSelect
            value={prefs.defaultCalendarView}
            onChange={(e) => prefs.setDefaultCalendarView(e.target.value as CalendarView)}
            className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20"
          >
            <option value="month">Month</option>
            <option value="week">Week</option>
            <option value="day">Day</option>
          </FormSelect>
        </div>
      </div>

      {/* Density */}
      <div className="rounded-xl border border-border bg-background px-6 py-6">
        <h3 className="text-sm font-semibold text-foreground mb-5">Density</h3>
        <div className="space-y-3">
          {(['comfortable', 'compact'] as const).map((opt) => (
            <label key={opt} className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="density"
                value={opt}
                checked={prefs.density === opt}
                onChange={() => prefs.setDensity(opt)}
                className="h-4 w-4 border-border text-foreground focus:ring-foreground/10"
              />
              <span className="text-sm text-foreground capitalize">{opt}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave}>
          Save Changes
        </Button>
      </div>
    </div>
  </RoleGate>
  );
}
