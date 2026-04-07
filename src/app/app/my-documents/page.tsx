import EmptyState from '@/components/ui/EmptyState';
import { FileText } from 'lucide-react';

export default function MyDocumentsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          My Documents
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Your personal file repository.
        </p>
      </div>

      <EmptyState
        icon={<FileText className="w-8 h-8" />}
        message="No documents uploaded"
        description="Your personal document library is currently being configured."
      />
    </div>
  );
}
