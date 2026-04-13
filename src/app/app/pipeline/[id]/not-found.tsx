import Link from 'next/link';
import Button from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
      <div className="text-4xl">🔍</div>
      <h2 className="text-lg font-semibold text-foreground">Not Found</h2>
      <p className="text-sm text-text-muted max-w-md">The item you&apos;re looking for doesn&apos;t exist or has been removed.</p>
      <Link href="/app/pipeline"><Button variant="secondary">Go back</Button></Link>
    </div>
  );
}
