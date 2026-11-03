import { describe, expect, it } from 'vitest';
import { gradeFor } from '../../src/ui/effects';

describe('time-of-day grading', () => {
  it('is clear at 4 PM, warmer by 6, deepest near sundown, subtler indoors', () => {
    const start = gradeFor(0, true), six = gradeFor(120, true), late = gradeFor(200, true), inside = gradeFor(200, false);
    expect(start.opacity).toBe(0);
    expect(six.opacity).toBeGreaterThan(0.1);
    expect(late.opacity).toBeGreaterThan(six.opacity);
    expect(late.darken).toBeGreaterThan(six.darken);
    expect(inside.opacity).toBeLessThan(late.opacity);
    expect(gradeFor(999, true)).toEqual(gradeFor(210, true));
  });
});
