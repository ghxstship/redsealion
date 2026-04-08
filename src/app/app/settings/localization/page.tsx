'use client';

import { useState, useEffect, useMemo } from 'react';
import { SUPPORTED_LOCALES, LOCALE_COOKIE, LOCALE_STORAGE_KEY, type SupportedLocale } from '@/lib/i18n/config';
import { useTranslation } from '@/lib/i18n/client';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

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
  const { t } = useTranslation();
  const [dateFormat, setDateFormat] = useState('MM/DD/YYYY');
  const [timeFormat, setTimeFormat] = useState('12h');
  const [firstDayOfWeek, setFirstDayOfWeek] = useState(0);
  const [numberFormat, setNumberFormat] = useState('en-US');
  const [language, setLanguage] = useState<SupportedLocale>('en-US');
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
        if (data.language) setLanguage(data.language as SupportedLocale);
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

      // Sync locale to cookie + localStorage so middleware and toggle stay in sync
      localStorage.setItem(LOCALE_STORAGE_KEY, language);
      document.cookie = `${LOCALE_COOKIE}=${language};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;
      document.documentElement.lang = language;
      window.dispatchEvent(new CustomEvent('fd-localization-change', { detail: { language } }));

      // Reload to apply server-side dictionary
      window.location.reload();
    } finally {
      setSaving(false);
    }
  }

  if (!loaded) return null;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">{t('settings.localization')}</h2>
        <p className="mt-1 text-sm text-text-secondary">
          {t('settings.localizationDesc')}
        </p>
      </div>

      {/* Date & Time */}
      <Card>
        <h3 className="text-sm font-semibold text-foreground mb-5">{t('settings.dateTime')}</h3>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5">
              {t('settings.dateFormat')}
            </label>
            <select
              value={dateFormat}
              onChange={(e) => setDateFormat(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20"
            >
              {dateFormatOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5">
              {t('settings.timeFormat')}
            </label>
            <select
              value={timeFormat}
              onChange={(e) => setTimeFormat(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20"
            >
              {timeFormatOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5">
              {t('settings.firstDayOfWeek')}
            </label>
            <select
              value={firstDayOfWeek}
              onChange={(e) => setFirstDayOfWeek(Number(e.target.value))}
              className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20"
            >
              {firstDayOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4 rounded-lg bg-bg-secondary px-4 py-3">
          <span className="text-xs font-medium text-text-muted uppercase tracking-wider">{t('settings.preview')}: </span>
          <span className="text-sm text-foreground font-mono">{preview}</span>
        </div>
      </Card>

      {/* Numbers & Currency */}
      <Card>
        <h3 className="text-sm font-semibold text-foreground mb-5">{t('settings.numbersCurrency')}</h3>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5">
              {t('settings.numberFormat')}
            </label>
            <select
              value={numberFormat}
              onChange={(e) => setNumberFormat(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20"
            >
              {numberFormatOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5">
              {t('settings.currency')}
            </label>
            <div className="flex items-center rounded-lg border border-border bg-bg-secondary px-3.5 py-2 text-sm text-text-secondary">
              {t('settings.currencySetInGeneral')}
            </div>
          </div>
        </div>
        <div className="mt-4 rounded-lg bg-bg-secondary px-4 py-3">
          <span className="text-xs font-medium text-text-muted uppercase tracking-wider">{t('settings.preview')}: </span>
          <span className="text-sm text-foreground font-mono">{numberPreview}</span>
        </div>
      </Card>

      {/* Language */}
      <Card>
        <h3 className="text-sm font-semibold text-foreground mb-5">{t('settings.language')}</h3>
        <div>
          <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5">
            {t('settings.language')}
          </label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as SupportedLocale)}
            className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/20"
          >
            {SUPPORTED_LOCALES.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <p className="mt-3 text-xs text-text-secondary">
          {t('settings.languageDesc')}
        </p>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? t('common.saving') : t('common.saveChanges')}
        </Button>
      </div>
    </div>
  );
}
