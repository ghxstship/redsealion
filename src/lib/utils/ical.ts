/**
 * iCalendar (.ics) file generator utility.
 * Converts schedule items to RFC 5545 compliant iCalendar format.
 * Compatible with Google Calendar, Outlook, Apple Calendar.
 */

export interface ICalEvent {
  uid: string;
  summary: string;
  description?: string;
  location?: string;
  dtstart: Date;
  dtend?: Date;
  allDay?: boolean;
  categories?: string[];
  status?: 'TENTATIVE' | 'CONFIRMED' | 'CANCELLED';
  url?: string;
}

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

/** Format a Date as iCal DATETIME string (UTC): 20260415T140000Z */
function formatDateTime(date: Date): string {
  return (
    date.getUTCFullYear().toString() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    'T' +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds()) +
    'Z'
  );
}

/** Format a Date as iCal DATE string (all-day): 20260415 */
function formatDate(date: Date): string {
  return (
    date.getUTCFullYear().toString() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate())
  );
}

/** Escape special characters per RFC 5545 */
function escapeText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/** Fold long lines at 75 octets per RFC 5545 */
function foldLine(line: string): string {
  const maxLen = 75;
  if (line.length <= maxLen) return line;

  const parts: string[] = [];
  parts.push(line.slice(0, maxLen));
  let pos = maxLen;
  while (pos < line.length) {
    parts.push(' ' + line.slice(pos, pos + maxLen - 1));
    pos += maxLen - 1;
  }
  return parts.join('\r\n');
}

/** Generate a VEVENT block */
function generateEvent(event: ICalEvent): string {
  const lines: string[] = [
    'BEGIN:VEVENT',
    `UID:${event.uid}`,
    `DTSTAMP:${formatDateTime(new Date())}`,
  ];

  if (event.allDay) {
    lines.push(`DTSTART;VALUE=DATE:${formatDate(event.dtstart)}`);
    if (event.dtend) {
      // iCal all-day events: DTEND is exclusive, so add 1 day
      const endPlusOne = new Date(event.dtend);
      endPlusOne.setUTCDate(endPlusOne.getUTCDate() + 1);
      lines.push(`DTEND;VALUE=DATE:${formatDate(endPlusOne)}`);
    }
  } else {
    lines.push(`DTSTART:${formatDateTime(event.dtstart)}`);
    if (event.dtend) {
      lines.push(`DTEND:${formatDateTime(event.dtend)}`);
    }
  }

  lines.push(`SUMMARY:${escapeText(event.summary)}`);

  if (event.description) {
    lines.push(`DESCRIPTION:${escapeText(event.description)}`);
  }
  if (event.location) {
    lines.push(`LOCATION:${escapeText(event.location)}`);
  }
  if (event.categories && event.categories.length > 0) {
    lines.push(`CATEGORIES:${event.categories.map(escapeText).join(',')}`);
  }
  if (event.status) {
    lines.push(`STATUS:${event.status}`);
  }
  if (event.url) {
    lines.push(`URL:${event.url}`);
  }

  lines.push('END:VEVENT');
  return lines.map(foldLine).join('\r\n');
}

/**
 * Generate a complete .ics file from an array of events.
 * Returns a string containing valid iCalendar data.
 */
export function generateICalendar(
  events: ICalEvent[],
  calendarName = 'FlyteDeck Schedule',
): string {
  const header = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//FlyteDeck//Schedule//EN',
    `X-WR-CALNAME:${escapeText(calendarName)}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ].join('\r\n');

  const body = events.map(generateEvent).join('\r\n');

  const footer = 'END:VCALENDAR';

  return header + '\r\n' + body + '\r\n' + footer + '\r\n';
}

/**
 * Generate a Google Calendar URL to add a single event.
 * Opens in a new tab for the user to confirm.
 */
export function generateGoogleCalendarUrl(event: ICalEvent): string {
  const dates = event.allDay
    ? `${formatDate(event.dtstart)}/${event.dtend ? formatDate(event.dtend) : formatDate(event.dtstart)}`
    : `${formatDateTime(event.dtstart)}/${event.dtend ? formatDateTime(event.dtend) : formatDateTime(event.dtstart)}`;

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.summary,
    dates,
  });

  if (event.description) params.set('details', event.description);
  if (event.location) params.set('location', event.location);

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generate a valid iCalendar (.ics) feed from simple event objects.
 * Accepts string dates for convenience in API routes.
 *
 * For richer iCalendar generation (all-day events, categories, status),
 * use `generateICalendar()` with `ICalEvent` objects instead.
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
  const icalEvents: ICalEvent[] = events.map((e) => ({
    uid: e.uid,
    summary: e.summary,
    dtstart: new Date(e.dtstart),
    dtend: new Date(e.dtend),
    location: e.location,
    description: e.description,
  }));
  return generateICalendar(icalEvents, 'FlyteDeck Calendar');
}
