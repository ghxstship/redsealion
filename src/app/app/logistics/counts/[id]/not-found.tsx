import { Search } from 'lucide-react';
import Link from 'next/link';
import Button from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
      <Search size={40} className="text-text-muted" />
      <h2 className="text-lg font-semibold text-foreground">Not Found</h2>
      <p className="text-sm text-text-muted max-w-md">The item you&apos;re looking for doesn&apos;t exist or has been removed.</p>
      <Link href="/app/counts"><Button variant="secondary">Go back</Button></Link>
    </div>
  );
}
