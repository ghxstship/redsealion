'use client';

import EmptyState from '@/components/ui/EmptyState';
import { Inbox } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/client';

export default function MyInboxPage() {
  const { t } = useTranslation();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {t('myInbox.title')}
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          {t('myInbox.subtitle')}
        </p>
      </div>

      <EmptyState
        icon={<Inbox className="w-8 h-8" />}
        message={t('myInbox.emptyState.title')}
        description={t('myInbox.emptyState.description')}
      />
    </div>
  );
}
