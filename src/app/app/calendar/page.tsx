import { redirect } from 'next/navigation';

/**
 * /app/calendar → redirect to the canonical calendar under Events hub.
 */
export default function CalendarRedirect() {
  redirect('/app/events/calendar');
}
