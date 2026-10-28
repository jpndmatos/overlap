import { describe, it, expect } from 'vitest';
import { daySlots, midnight, localParts, available, working, nextDate, type City } from './time';
const lisbon: City = { id: '1', name: 'Lisbon', zone: 'Europe/Lisbon', start: 9, end: 18 };
describe('timezone planning', () => {
  it('uses 23 and 25 hours on daylight-saving change days', () => {
    expect(daySlots('2026-03-29', 'Europe/Lisbon')).toHaveLength(46);
    expect(daySlots('2026-10-25', 'Europe/Lisbon')).toHaveLength(50);
  });
  it('handles quarter-hour offsets and different local dates', () => {
    const t = midnight('2026-10-28', 'Asia/Kathmandu');
    expect(new Date(t).toISOString()).toBe('2026-10-27T18:15:00.000Z');
    expect(localParts(t, 'Asia/Kathmandu').hour).toBe(0);
  });
  it('requires the entire meeting to fit, not just its starting time', () => {
    expect(available(Date.parse('2026-10-28T17:30Z'), 60, [lisbon])).toBe(false);
    expect(available(Date.parse('2026-10-28T17:00Z'), 60, [lisbon])).toBe(true);
  });
  it('respects weekends and overnight hours', () => {
    expect(working(Date.parse('2026-10-31T12:00Z'), lisbon)).toBe(false);
    expect(working(Date.parse('2026-10-31T12:00Z'), lisbon, true)).toBe(true);
    expect(working(Date.parse('2026-10-28T23:00Z'), { ...lisbon, start: 22, end: 6 })).toBe(true);
  });
  it('moves dates safely across year boundaries', () => {
    expect(nextDate('2026-12-31')).toBe('2027-01-01');
  });
  it('finds a real common window across DST differences', () => {
    const ny = { ...lisbon, zone: 'America/New_York' };
    expect(available(Date.parse('2026-10-28T13:00Z'), 60, [lisbon, ny])).toBe(true);
    expect(available(Date.parse('2026-10-28T12:00Z'), 60, [lisbon, ny])).toBe(false);
  });
});
