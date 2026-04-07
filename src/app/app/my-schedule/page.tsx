'use client';

import EmptyState from '@/components/ui/EmptyState';
import { Calendar } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/client';
import PageHeader from '@/components/shared/PageHeader';

export default function MySchedulePage() {
  const { t } = useTranslation();

  return (
    <div>
<PageHeader
        title="{t('mySchedule.title')}"
        subtitle={`{t('mySchedule.subtitle')}`}
      />

      <EmptyState
        icon={<Calendar className="w-8 h-8" />}
        message={t('mySchedule.emptyState.title')}
        description={t('mySchedule.emptyState.description')}
      />
    </div>
  );
}
