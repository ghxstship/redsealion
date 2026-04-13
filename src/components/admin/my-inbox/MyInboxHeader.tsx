'use client';

import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';
import PageHeader from '@/components/shared/PageHeader';
import { Badge } from '@/components/ui/Badge';
import NotificationFormModal from './NotificationFormModal';
import { Send } from 'lucide-react';

interface MyInboxHeaderProps {
  unreadCount: number;
}

export default function MyInboxHeader({ unreadCount }: MyInboxHeaderProps) {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <PageHeader
      title={
        <div className="flex items-center gap-3">
          <span>{t('myInbox.title')}</span>
          {unreadCount > 0 && <Badge variant="primary">{unreadCount} new</Badge>}
        </div>
      }
      subtitle={t('myInbox.subtitle')}
      actionLabel="New Message"
      actionIcon={<Send size={16} />}
      renderModal={(props) => (
        <NotificationFormModal
          open={props.open}
          onClose={props.onClose}
          onCreated={() => {
            props.onCreated();
            router.refresh();
          }}
        />
      )}
    />
  );
}
