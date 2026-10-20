import test from 'node:test';
import assert from 'node:assert/strict';
import { getEffectiveTheme, getAccentTheme, ACCENT_PALETTE } from './theme.ts';
import type { AccentColor } from '../types/clock.ts';

test('getEffectiveTheme returns explicit dark and light', () => {
  assert.equal(getEffectiveTheme('dark'), 'dark');
  assert.equal(getEffectiveTheme('light'), 'light');
});

test('ACCENT_PALETTE defines both dark and light for all 5 accents with high contrast', () => {
  const accents: AccentColor[] = ['amber', 'sky', 'emerald', 'indigo', 'rose'];

  for (const acc of accents) {
    const palette = ACCENT_PALETTE[acc];
    assert.ok(palette, `Missing palette for ${acc}`);
    assert.ok(palette.dark.hex.startsWith('#'), `${acc} dark hex invalid`);
    assert.ok(palette.light.hex.startsWith('#'), `${acc} light hex invalid`);
    assert.ok(palette.dark.contrast, `${acc} dark contrast missing`);
    assert.ok(palette.light.contrast, `${acc} light contrast missing`);
  }
});

test('getAccentTheme returns CSS classes and hex for chosen mode', () => {
  const darkAmber = getAccentTheme('amber', 'dark');
  assert.equal(darkAmber.hex, '#F59E0B');
  assert.equal(darkAmber.contrastText, '#000000');

  const lightAmber = getAccentTheme('amber', 'light');
  assert.equal(lightAmber.hex, '#D97706');
  assert.equal(lightAmber.contrastText, '#FFFFFF');
});
