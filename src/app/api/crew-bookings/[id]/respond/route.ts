import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { createLogger } from '@/lib/logger';

const log = createLogger('crew-bookings');

/**
 * POST /api/crew-bookings/[id]/respond
 *
 * Public endpoint for crew members to accept or decline a booking offer.
 * Receives form-encoded data with a "response" field ('accepted' | 'declined').
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: bookingId } = await params;

  try {
    // Parse form data (native HTML form) or JSON body
    let response: string | null = null;
    const contentType = request.headers.get('content-type') ?? '';

    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData();
      response = formData.get('response') as string | null;
    } else {
      const body = await request.json().catch(() => ({}));
      response = body.response ?? null;
    }

    if (!response || !['accepted', 'declined'].includes(response)) {
      return NextResponse.json(
        { error: 'Invalid response. Must be "accepted" or "declined".' },
        { status: 400 },
      );
    }

    const supabase = await createServiceClient();

    // Verify booking exists and is in 'offered' state
    const { data: booking, error: findError } = await supabase
      .from('crew_bookings')
      .select('id, status, organization_id')
      .eq('id', bookingId)
      .single();

    if (findError || !booking) {
      return NextResponse.json(
        { error: 'Booking not found.' },
        { status: 404 },
      );
    }

    if (booking.status !== 'offered') {
      return NextResponse.json(
        { error: `This booking has already been ${booking.status}.` },
        { status: 409 },
      );
    }

    // Update status
    const { error: updateError } = await supabase
      .from('crew_bookings')
      .update({
        status: response,
        responded_at: new Date().toISOString(),
      })
      .eq('id', bookingId);

    if (updateError) {
      log.error('Failed to update booking', { bookingId }, updateError);
      return NextResponse.json(
        { error: 'Failed to update booking.' },
        { status: 500 },
      );
    }

    // For form submissions, redirect back to the booking page
    if (contentType.includes('application/x-www-form-urlencoded')) {
      // Get org slug for redirect
      const { data: org } = await supabase
        .from('organizations')
        .select('slug')
        .eq('id', booking.organization_id)
        .single();

      const slug = org?.slug ?? 'org';
      return NextResponse.redirect(
        new URL(`/portal/${slug}/bookings/${bookingId}`, request.url),
        303,
      );
    }

    return NextResponse.json({ success: true, status: response });
  } catch (err) {
    log.error('Error responding to booking', { bookingId }, err);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 },
    );
  }
}
