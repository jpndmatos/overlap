const stamp = (time: number) =>
  new Date(time)
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
const escapeText = (text: string) =>
  text
    .replace(/\\/g, '\\\\')
    .replace(/\r\n|\r|\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,');

// Calendar content lines are limited to 75 UTF-8 bytes, including continuation spaces.
function fold(line: string): string {
  const encoder = new TextEncoder();
  let result = '',
    size = 0;
  for (const char of line) {
    const bytes = encoder.encode(char).length;
    if (size + bytes > 75) {
      result += '\r\n ';
      size = 1;
    }
    result += char;
    size += bytes;
  }
  return result;
}

export function meetingCalendar(
  start: number,
  duration: number,
  title: string,
  description: string,
) {
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Overlap//Meeting Planner//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${crypto.randomUUID()}@overlap.local`,
    `DTSTAMP:${stamp(Date.now())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(start + duration * 60000)}`,
    `SUMMARY:${escapeText(title.trim() || 'Meeting')}`,
    `DESCRIPTION:${escapeText(description)}`,
    'END:VEVENT',
    'END:VCALENDAR',
    '',
  ]
    .map(fold)
    .join('\r\n');
}
