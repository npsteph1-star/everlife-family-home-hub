/**
 * Family Home Hub — ICS Calendar Utility
 *
 * Generates RFC 5545-compliant .ics files so family events can be added
 * to any calendar app (Apple, Google, Outlook, etc.).
 *
 * No external API calls — all logic runs entirely client-side.
 */

/** Zero-pad a number to 2 digits. */
function pad(n) {
  return String(n).padStart(2, '0');
}

/**
 * Convert a date string ('YYYY-MM-DD') and optional time ('HH:MM')
 * into an ICS date-time stamp.
 *  - All-day events: YYYYMMDD
 *  - Timed events:   YYYYMMDDTHHMMSS (local, no Z — avoids UTC offset issues)
 */
function toICSDateTime(dateStr, timeStr) {
  const [year, month, day] = dateStr.split('-');
  if (timeStr) {
    const [hour, minute] = timeStr.split(':');
    return `${year}${month}${day}T${hour}${minute}00`;
  }
  return `${year}${month}${day}`;
}

/** Escape special ICS characters. */
function esc(str) {
  return (str || '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Build an ICS file string for a single calendar event.
 * @param {Object} event - event object from DataContext (id, title, date, time, notes, type)
 * @returns {string} ICS file content
 */
export function generateICS(event) {
  const isAllDay = !event.time;
  const dtStart = toICSDateTime(event.date, event.time);
  const now = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z';
  const uid = `${event.id}@familyhomehub.app`;

  // For timed events, end = start + 1 hour (reasonable default)
  let dtEnd = dtStart;
  if (!isAllDay && event.time) {
    const [h, m] = event.time.split(':').map(Number);
    const endHour = (h + 1) % 24;
    const [y, mo, d] = event.date.split('-');
    dtEnd = `${y}${mo}${d}T${pad(endHour)}${pad(m)}00`;
  }

  const dtStartLine = isAllDay
    ? `DTSTART;VALUE=DATE:${dtStart}`
    : `DTSTART:${dtStart}`;
  const dtEndLine = isAllDay
    ? `DTEND;VALUE=DATE:${dtStart}` // same day all-day
    : `DTEND:${dtEnd}`;

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Family Home Hub//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    dtStartLine,
    dtEndLine,
    `SUMMARY:${esc(event.title)}`,
    event.notes ? `DESCRIPTION:${esc(event.notes)}` : null,
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .join('\r\n');

  return lines;
}

/**
 * Trigger a browser download of a .ics file for the given event.
 * @param {Object} event
 */
export function downloadICS(event) {
  const content = generateICS(event);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${event.title.replace(/[^a-z0-9\s-]/gi, '').replace(/\s+/g, '_')}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Build a Google Calendar "add event" URL for the event.
 * Opens Google Calendar with the event pre-filled.
 * @param {Object} event
 * @returns {string} URL
 */
export function googleCalendarURL(event) {
  const dtStart = toICSDateTime(event.date, event.time);
  const isAllDay = !event.time;

  let dtEnd = dtStart;
  if (!isAllDay && event.time) {
    const [h, m] = event.time.split(':').map(Number);
    const endHour = (h + 1) % 24;
    const [y, mo, d] = event.date.split('-');
    dtEnd = `${y}${mo}${d}T${pad(endHour)}${pad(m)}00`;
  }

  const dates = isAllDay
    ? `${dtStart}/${dtStart}`
    : `${dtStart}/${dtEnd}`;

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates,
    details: event.notes || '',
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
