'use client';

import { useState, useEffect, useMemo } from 'react';

const dateFormatOptions = [
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
];

const timeFormatOptions = [
  { value: '12h', label: '12-hour' },
  { value: '24h', label: '24-hour' },
];

const firstDayOptions = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 6, label: 'Saturday' },
];

const numberFormatOptions = [
  { value: 'en-US', label: 'en-US (1,234.56)' },
  { value: 'de-DE', label: 'de-DE (1.234,56)' },
  { value: 'fr-FR', label: 'fr-FR (1 234,56)' },
];

const languageOptions = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'ja', label: 'Japanese' },
  { value: 'pt', label: 'Portuguese' },
];

function formatPreviewDate(dateFormat: string, timeFormat: string): string {
  const now = new Date();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const y = now.getFullYear();

  let datePart: string;
  switch (dateFormat) {
    case 'DD/MM/YYYY':
      datePart = `${d}/${m}/${y}`;
      break;
    case 'YYYY-MM-DD':
      datePart = `${y}-${m}-${d}`;
      break;
    default:
      datePart = `${m}/${d}/${y}`;
  }

  let timePart: string;
  if (timeFormat === '24h') {
    timePart = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  } else {
    const h = now.getHours();
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    timePart = `${h12}:${String(now.getMinutes()).padStart(2, '0')} ${ampm}`;
  }

  return `${datePart} ${timePart}`;
}

function formatPreviewNumber(locale: string): string {
  try {
    return new Intl.NumberFormat(locale, { minimumFractionDigits: 2 }).format(1234.56);
  } catch {
    return '1,234.56';
  }
}

export default function LocalizationSettingsPage() {
  const [dateFormat, setDateFormat] = useState('MM/DD/YYYY');
  const [timeFormat, setTimeFormat] = useState('12h');
  const [firstDayOfWeek, setFirstDayOfWeek] = useState(0);
  const [numberFormat, setNumberFormat] = useState('en-US');
  const [language, setLanguage] = useState('en');
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/settings/localization')
      .then((r) => r.json())
      .then((data) => {
        if (data.date_format) setDateFormat(data.date_format);
        if (data.time_format) setTimeFormat(data.time_format);
        if (typeof data.first_day_of_week === 'number') setFirstDayOfWeek(data.first_day_of_week);
        if (data.number_format) setNumberFormat(data.number_format);
        if (data.language) setLanguage(data.language);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const preview = useMemo(() => formatPreviewDate(dateFormat, timeFormat), [dateFormat, timeFormat]);
  const numberPreview = useMemo(() => formatPreviewNumber(numberFormat), [numberFormat]);

  async function handleSave() {
    setSaving(true);
    try {
      await fetch('/api/settings/localization', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date_format: dateFormat,
          time_format: timeFormat,
          first_day_of_week: firstDayOfWeek,
          number_format: numberFormat,
          language,
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
        <h2 className="text-lg font-semibold text-foreground">Localization</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Set date, time, and number formatting for your organization.
        </p>
      </div>

      {/* Date & Time */}
      <div className="rounded-xl border border-border bg-white px-6 py-6">
        <h3 className="text-sm font-semibold text-foreground mb-5">Date &amp; Time</h3>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5">
              Date Format
            </label>
            <select
              value={dateFormat}
              onChange={(e) => setDateFormat(e.target.value)}
              className="w-full rounded-lg border border-border bg-white px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20"
            >
              {dateFormatOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5">
              Time Format
            </label>
            <select
              value={timeFormat}
              onChange={(e) => setTimeFormat(e.target.value)}
              className="w-full rounded-lg border border-border bg-white px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20"
            >
              {timeFormatOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5">
              First Day of Week
            </label>
            <select
              value={firstDayOfWeek}
              onChange={(e) => setFirstDayOfWeek(Number(e.target.value))}
              className="w-full rounded-lg border border-border bg-white px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20"
            >
              {firstDayOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4 rounded-lg bg-gray-50 px-4 py-3">
          <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Preview: </span>
          <span className="text-sm text-foreground font-mono">{preview}</span>
        </div>
      </div>

      {/* Numbers & Currency */}
      <div className="rounded-xl border border-border bg-white px-6 py-6">
        <h3 className="text-sm font-semibold text-foreground mb-5">Numbers &amp; Currency</h3>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5">
              Number Format
            </label>
            <select
              value={numberFormat}
              onChange={(e) => setNumberFormat(e.target.value)}
              className="w-full rounded-lg border border-border bg-white px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20"
            >
              {numberFormatOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5">
              Currency
            </label>
            <div className="flex items-center rounded-lg border border-border bg-gray-50 px-3.5 py-2 text-sm text-text-secondary">
              Set in General settings
            </div>
          </div>
        </div>
        <div className="mt-4 rounded-lg bg-gray-50 px-4 py-3">
          <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Preview: </span>
          <span className="text-sm text-foreground font-mono">{numberPreview}</span>
        </div>
      </div>

      {/* Language */}
      <div className="rounded-xl border border-border bg-white px-6 py-6">
        <h3 className="text-sm font-semibold text-foreground mb-5">Language</h3>
        <div>
          <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5">
            Language
          </label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full rounded-lg border border-border bg-white px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20"
          >
            {languageOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <p className="mt-3 text-xs text-text-secondary">
          Changing language affects the admin interface. Client portal language is set per-proposal.
        </p>
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
