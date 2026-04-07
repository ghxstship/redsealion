'use client';

import EmptyState from '@/components/ui/EmptyState';
import { FileText } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/client';
import PageHeader from '@/components/shared/PageHeader';

export default function MyDocumentsPage() {
  const { t } = useTranslation();

  return (
    <div>
<PageHeader
        title="{t('myDocuments.title')}"
        subtitle={`{t('myDocuments.subtitle')}`}
      />

      <EmptyState
        icon={<FileText className="w-8 h-8" />}
        message={t('myDocuments.emptyState.title')}
        description={t('myDocuments.emptyState.description')}
      />
    </div>
  );
}
