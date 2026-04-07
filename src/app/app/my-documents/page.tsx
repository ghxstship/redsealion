'use client';

import EmptyState from '@/components/ui/EmptyState';
import { FileText } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/client';

export default function MyDocumentsPage() {
  const { t } = useTranslation();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {t('myDocuments.title')}
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          {t('myDocuments.subtitle')}
        </p>
      </div>

      <EmptyState
        icon={<FileText className="w-8 h-8" />}
        message={t('myDocuments.emptyState.title')}
        description={t('myDocuments.emptyState.description')}
      />
    </div>
  );
}
