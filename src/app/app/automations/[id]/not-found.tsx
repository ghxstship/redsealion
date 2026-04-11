import Link from 'next/link';
import Button from '@/components/ui/Button';

export default function AutomationNotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="rounded-xl border border-border bg-background px-8 py-10 max-w-md">
        <h2 className="text-lg font-semibold text-foreground">Automation not found</h2>
        <p className="mt-2 text-sm text-text-muted">
          This automation may have been deleted or you may not have permission to view it.
        </p>
        <div className="mt-6">
          <Link href="/app/automations">
            <Button variant="secondary">Back to Automations</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
