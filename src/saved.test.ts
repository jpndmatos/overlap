import { describe, it, expect } from 'vitest';
import { parseSavedTimes } from './saved';
describe('saved meeting times', () => {
  const valid = { id: 'a', title: 'Planning', start: Date.UTC(2026, 9, 28, 14), duration: 60 };
  it('keeps the absolute meeting time, independent of the viewing city', () => {
    expect(parseSavedTimes(JSON.stringify([valid]))).toEqual([valid]);
  });
  it('recovers from malformed storage and rejects invalid dates and durations', () => {
    expect(parseSavedTimes('{')).toEqual([]);
    expect(parseSavedTimes('{}')).toEqual([]);
    expect(
      parseSavedTimes(
        JSON.stringify([
          null,
          { ...valid, start: 'today' },
          { ...valid, duration: -30 },
          { ...valid, title: '' },
          { ...valid, start: 0 },
        ]),
      ),
    ).toEqual([]);
  });
  it('keeps no more than six saved choices', () => {
    expect(
      parseSavedTimes(
        JSON.stringify(Array.from({ length: 10 }, (_, i) => ({ ...valid, id: String(i) }))),
      ),
    ).toHaveLength(6);
  });
});
