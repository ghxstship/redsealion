'use client';

import { useTranslation } from '@/lib/i18n/client';
import PageHeader from '@/components/shared/PageHeader';
import { Badge } from '@/components/ui/Badge';

interface MyInboxHeaderProps {
  unreadCount: number;
}

export default function MyInboxHeader({ unreadCount }: MyInboxHeaderProps) {
  const { t } = useTranslation();

  return (
    <PageHeader
      title={
        <div className="flex items-center gap-3">
          <span>{t('myInbox.title')}</span>
          {unreadCount > 0 && <Badge variant="primary">{unreadCount} new</Badge>}
        </div>
      }
      subtitle={t('myInbox.subtitle')}
    />
  );
}
