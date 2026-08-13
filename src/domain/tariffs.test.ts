import { describe, expect, it } from 'vitest';
import { getPrice, TARIFFS } from './tariffs';

describe('tariff catalog', () => {
  it('returns the approved price for every tariff period', () => {
    expect(getPrice('base', 1)).toBe(250);
    expect(getPrice('base', 3)).toBe(490);
    expect(getPrice('base', 6)).toBe(940);
    expect(getPrice('base', 12)).toBe(1390);
    expect(getPrice('elite', 1)).toBe(310);
    expect(getPrice('elite', 3)).toBe(690);
    expect(getPrice('elite', 6)).toBe(1290);
    expect(getPrice('elite', 12)).toBe(1990);
  });

  it('exposes only the active tariff ids in display order', () => {
    expect(TARIFFS.map(({ id }) => id)).toEqual(['base', 'elite']);
  });
});
