'use client';

import EmptyState from '@/components/ui/EmptyState';
import { Inbox } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/client';
import PageHeader from '@/components/shared/PageHeader';

export default function MyInboxPage() {
  const { t } = useTranslation();

  return (
    <div>
<PageHeader
        title="{t('myInbox.title')}"
        subtitle={`{t('myInbox.subtitle')}`}
      />

      <EmptyState
        icon={<Inbox className="w-8 h-8" />}
        message={t('myInbox.emptyState.title')}
        description={t('myInbox.emptyState.description')}
      />
    </div>
  );
}
