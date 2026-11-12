import { describe, it, expect } from 'vitest';
import { meetingCalendar } from './calendar';

describe('calendar export', () => {
  it('preserves the meeting name, city notes and UTC duration', () => {
    const text = meetingCalendar(
      Date.UTC(2026, 9, 25, 1),
      90,
      'Design, review; João',
      'Lisbon\nNew York',
    );
    expect(text).toContain('SUMMARY:Design\\, review\\; João\r\n');
    expect(text).toContain('DESCRIPTION:Lisbon\\nNew York');
    expect(text).toContain('DTSTART:20261025T010000Z');
    expect(text).toContain('DTEND:20261025T023000Z');
  });
  it('folds long Unicode lines without splitting characters or injecting fields', () => {
    const text = meetingCalendar(Date.now(), 30, 'é'.repeat(60), 'Notes\r\nATTENDEE:someone');
    for (const line of text.split('\r\n'))
      expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    expect(text.replace(/\r\n /g, '')).toContain('SUMMARY:' + 'é'.repeat(60));
    expect(text).not.toContain('\r\nATTENDEE:');
  });
});
