'use client';

import { useGlobalModals } from '@/components/shared/GlobalModalProvider';
import { useTranslation } from '@/lib/i18n/client';
import Button from '@/components/ui/Button';

interface MyTasksHeaderProps {
  taskCount: number;
}

export default function MyTasksHeader({ taskCount }: MyTasksHeaderProps) {
  const { openModal } = useGlobalModals();
  const { t } = useTranslation();

  return (
    <div className="mb-8 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{t('myTasks.title')}</h1>
        <p className="mt-1 text-sm text-text-secondary">
          {t('myTasks.subtitle', { count: taskCount })}
        </p>
      </div>
      <Button
        onClick={() => openModal('task')}
        className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
      >
        {t('myTasks.newTask')}
      </Button>
    </div>
  );
}
