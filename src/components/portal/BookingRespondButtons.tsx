'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';

interface BookingRespondButtonsProps {
  bookingId: string;
  orgSlug: string;
}

export default function BookingRespondButtons({ bookingId, orgSlug }: BookingRespondButtonsProps) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<'accepted' | 'declined' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  if (result) {
    return (
      <div className="w-full max-w-lg rounded-lg border border-green-200 bg-green-50 p-4 text-center">
        <p className="text-sm font-medium text-green-800">
          Booking {result === 'accepted' ? 'accepted' : 'declined'} successfully.
        </p>
      </div>
    );
  }

  async function handleRespond(response: 'accepted' | 'declined') {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/crew-bookings/${bookingId}/respond`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ response }),
          redirect: 'manual', // Don't follow 303 redirects
        });

        // The API returns a 303 redirect on success, or a JSON response
        if (res.type === 'opaqueredirect' || res.status === 303 || res.ok) {
          setResult(response);
          router.refresh();
          return;
        }

        const data = await res.json().catch(() => ({}));
        setError(data.error ?? 'Failed to respond. Please try again.');
      } catch {
        setError('Network error. Please try again.');
      }
    });
  }

  return (
    <div className="w-full max-w-lg space-y-3">
      <div className="flex gap-3">
        <Button
          type="button"
          onClick={() => handleRespond('accepted')}
          disabled={isPending}
          className="flex-1 rounded-lg bg-foreground px-4 py-3 text-sm font-medium text-background transition-colors hover:bg-foreground/90 disabled:opacity-50"
        >
          {isPending ? 'Processing…' : 'Accept Booking'}
        </Button>
        <Button
          type="button"
          onClick={() => handleRespond('declined')}
          disabled={isPending}
          className="flex-1 rounded-lg border border-border bg-card px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-bg-secondary disabled:opacity-50"
        >
          {isPending ? 'Processing…' : 'Decline'}
        </Button>
      </div>
      {error && (
        <p className="text-xs text-red-600 text-center">{error}</p>
      )}
    </div>
  );
}
