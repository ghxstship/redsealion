import { createClient } from '@/lib/supabase/server';
import { XCircle, Calendar, MapPin } from 'lucide-react';

interface BookingData {
  id: string;
  role: string;
  status: string;
  shift_start: string;
  shift_end: string | null;
  event_name: string;
  org_name: string;
  location: string | null;
}

async function getBooking(
  orgSlug: string,
  bookingId: string
): Promise<{ data: BookingData | null; error: string | null }> {
  try {
    const supabase = await createClient();

    const { data: org } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('slug', orgSlug)
      .single();

    if (!org) return { data: null, error: 'Organization not found.' };

    const { data: booking } = await supabase
      .from('crew_bookings')
      .select('id, role, status, shift_start, shift_end, proposal_id')
      .eq('id', bookingId)
      .eq('organization_id', org.id)
      .single();

    if (!booking) return { data: null, error: 'Booking not found or has expired.' };

    let eventName = 'Event';
    if (booking.proposal_id) {
      const { data: proposal } = await supabase
        .from('proposals')
        .select('name')
        .eq('id', booking.proposal_id)
        .single();
      if (proposal) eventName = proposal.name;
    }

    return {
      data: {
        id: booking.id,
        role: booking.role,
        status: booking.status,
        shift_start: booking.shift_start,
        shift_end: booking.shift_end,
        event_name: eventName,
        org_name: org.name,
        location: null,
      },
      error: null,
    };
  } catch {
    return { data: null, error: 'Unable to load booking details.' };
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatLabel(s: string): string {
  return s
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

const STATUS_COLORS: Record<string, string> = {
  offered: 'bg-blue-50 text-blue-700',
  accepted: 'bg-green-50 text-green-700',
  declined: 'bg-red-50 text-red-600',
  confirmed: 'bg-indigo-50 text-indigo-700',
  cancelled: 'bg-gray-100 text-gray-600',
};

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ orgSlug: string; bookingId: string }>;
}) {
  const { orgSlug, bookingId } = await params;
  const { data: booking, error } = await getBooking(orgSlug, bookingId);

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-bg-secondary flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
            <XCircle className="text-red-500" size={24} strokeWidth={2} />
          </div>
          <h1 className="text-lg font-semibold text-foreground">Booking Not Found</h1>
          <p className="mt-2 text-sm text-text-secondary">
            {error ?? 'This booking link is invalid or has expired.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-secondary flex flex-col items-center p-6">
      <div className="w-full max-w-lg mb-8">
        <p className="text-sm text-text-muted text-center">{booking.org_name}</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground text-center">
          Booking Offer
        </h1>
      </div>

      <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-semibold text-foreground">{booking.event_name}</h2>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
              STATUS_COLORS[booking.status] ?? 'bg-gray-100 text-gray-600'
            }`}
          >
            {formatLabel(booking.status)}
          </span>
        </div>

        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Calendar className="text-text-muted mt-0.5 shrink-0" size={16} />
            <div>
              <p className="text-sm font-medium text-foreground">
                {formatDate(booking.shift_start)}
              </p>
              <p className="text-xs text-text-muted">
                {formatTime(booking.shift_start)}
                {booking.shift_end ? ` – ${formatTime(booking.shift_end)}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MapPin className="text-text-muted mt-0.5 shrink-0" size={16} />
            <div>
              <p className="text-sm text-foreground">
                {booking.location ?? 'Location to be confirmed'}
              </p>
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <p className="text-xs text-text-muted">Your Role</p>
            <p className="text-sm font-medium text-foreground mt-0.5">
              {formatLabel(booking.role)}
            </p>
          </div>
        </div>
      </div>

      {booking.status === 'offered' && (
        <div className="w-full max-w-lg flex gap-3">
          <form action={`/api/crew-bookings/${bookingId}/respond`} method="POST" className="flex-1">
            <input type="hidden" name="response" value="accepted" />
            <button
              type="submit"
              className="w-full rounded-lg bg-foreground px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-foreground/90"
            >
              Accept Booking
            </button>
          </form>
          <form action={`/api/crew-bookings/${bookingId}/respond`} method="POST" className="flex-1">
            <input type="hidden" name="response" value="declined" />
            <button
              type="submit"
              className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-bg-secondary"
            >
              Decline
            </button>
          </form>
        </div>
      )}

      <p className="mt-6 text-center text-xs text-text-muted">
        Powered by FlyteDeck
      </p>
    </div>
  );
}
