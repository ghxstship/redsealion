/**
 * Generate a valid iCalendar (.ics) feed from an array of event objects.
 */
export function generateICalFeed(
  events: Array<{
    uid: string;
    summary: string;
    dtstart: string;
    dtend: string;
    location?: string;
    description?: string;
  }>,
): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//FlyteDeck//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  for (const event of events) {
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${event.uid}`);
    lines.push(`DTSTART:${formatICalDate(event.dtstart)}`);
    lines.push(`DTEND:${formatICalDate(event.dtend)}`);
    lines.push(`SUMMARY:${escapeICalText(event.summary)}`);
    if (event.location) {
      lines.push(`LOCATION:${escapeICalText(event.location)}`);
    }
    if (event.description) {
      lines.push(`DESCRIPTION:${escapeICalText(event.description)}`);
    }
    lines.push(`DTSTAMP:${formatICalDate(new Date().toISOString())}`);
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

function formatICalDate(iso: string): string {
  return iso.replace(/[-:]/g, '').replace(/\.\d{3}/, '').replace('Z', 'Z');
}

function escapeICalText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}
