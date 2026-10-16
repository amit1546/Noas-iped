import { describe, expect, it } from 'vitest';
import { backupFileName } from '../db/backup';
import { ACCENT_PRESETS, appearanceVars, BACKGROUND_PRESETS } from '../lib/appearance';
import { SHADES } from '../lib/palettes';

describe('appearance', () => {
  it('has a full set of ten shades for every accent, in three slots', () => {
    expect(ACCENT_PRESETS.length).toBeGreaterThanOrEqual(8);
    for (const p of ACCENT_PRESETS) {
      for (const slot of [p.a, p.b, p.c]) {
        expect(slot).toHaveLength(SHADES.length);
        for (const rgb of slot) expect(rgb).toMatch(/^\d{1,3} \d{1,3} \d{1,3}$/);
      }
    }
  });

  it('keeps the original look as the default (blue accent, cool background)', () => {
    const light = appearanceVars('blue', 'cool', false);
    expect(light['--a-600']).toBe('37 99 235'); // Tailwind blue-600, what the app always used
    expect(light['--canvas']).toBe('243 246 252');
    expect(appearanceVars('blue', 'cool', true)['--canvas']).toBe('11 17 32');
  });

  it('changes the main color without touching the background, and vice versa', () => {
    const violet = appearanceVars('violet', 'cool', false);
    const blue = appearanceVars('blue', 'cool', false);
    expect(violet['--a-600']).not.toBe(blue['--a-600']);
    expect(violet['--canvas']).toBe(blue['--canvas']);
    expect(appearanceVars('blue', 'warm', false)['--a-600']).toBe(blue['--a-600']);
    expect(appearanceVars('blue', 'warm', false)['--canvas']).not.toBe(blue['--canvas']);
  });

  it('has a light and a dark version of every background', () => {
    for (const bg of BACKGROUND_PRESETS) {
      expect(bg.light.canvas).not.toBe(bg.dark.canvas);
    }
  });

  it('falls back to the default for an unknown choice', () => {
    expect(appearanceVars('nope' as never, 'nope' as never, false)['--a-600']).toBe('37 99 235');
  });
});

describe('backup file name', () => {
  it('is "יומן עמית" followed by the date of the save', () => {
    expect(backupFileName(new Date(2026, 9, 15))).toBe('יומן עמית 2026-10-15.json');
    expect(backupFileName(new Date(2026, 0, 5))).toBe('יומן עמית 2026-01-05.json');
  });
});
