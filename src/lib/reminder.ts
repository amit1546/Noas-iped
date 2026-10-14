/**
 * Builds an .ics file with a weekly repeating event + alarm. Opening it on an
 * iPhone/iPad/Mac adds a real recurring reminder to the device calendar, which
 * works even when the app is closed (web apps can't schedule notifications).
 */
export function weeklyReminderICS(opts: { title: string; weekday: number; hour: number; minute: number; url: string }) {
  const days = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
  const start = new Date();
  start.setDate(start.getDate() + ((opts.weekday - start.getDay() + 7) % 7));
  start.setHours(opts.hour, opts.minute, 0, 0);
  if (start < new Date()) start.setDate(start.getDate() + 7);
  const end = new Date(start.getTime() + 10 * 60 * 1000);
  const fmt = (d: Date) =>
    `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}T${String(
      d.getHours(),
    ).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}00`;
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//noas-journal//HE',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:weigh-in-${stamp}@noas-journal`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `RRULE:FREQ=WEEKLY;BYDAY=${days[opts.weekday]}`,
    `SUMMARY:${opts.title}`,
    `URL:${opts.url}`,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${opts.title}`,
    'TRIGGER:PT0M',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

export function downloadICS(text: string, filename: string) {
  const blob = new Blob([text], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Days since the given ISO date (0 = today). */
export function daysSince(iso: string, today: string): number {
  return Math.round((Date.parse(today) - Date.parse(iso)) / 86400000);
}
