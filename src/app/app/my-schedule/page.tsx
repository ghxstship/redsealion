'use client';

import EmptyState from '@/components/ui/EmptyState';
import { Calendar } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/client';

export default function MySchedulePage() {
  const { t } = useTranslation();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {t('mySchedule.title')}
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          {t('mySchedule.subtitle')}
        </p>
      </div>

      <EmptyState
        icon={<Calendar className="w-8 h-8" />}
        message={t('mySchedule.emptyState.title')}
        description={t('mySchedule.emptyState.description')}
      />
    </div>
  );
}
