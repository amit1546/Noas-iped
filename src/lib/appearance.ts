import type { AccentId, BackgroundId, ThemePref } from '../db/schema';
import { ACCENT_PRESETS, SHADES } from './palettes';

export { ACCENT_PRESETS };

/** CSS colors for the app's main color. They follow whichever accent is chosen in Settings. */
export const ACCENT_500 = 'rgb(var(--a-500))';
export const ACCENT_600 = 'rgb(var(--a-600))';
export const ACCENT_300 = 'rgb(var(--a-300))';

interface Tone {
  canvas: string;
  surface: string;
  ink: string;
  muted: string;
  line: string;
}

export interface BackgroundPreset {
  id: BackgroundId;
  label: string;
  light: Tone;
  dark: Tone;
}

/** Page/card/text tones. "cool" matches the original look. */
export const BACKGROUND_PRESETS: BackgroundPreset[] = [
  {
    id: 'cool',
    label: 'כחלחל',
    light: { canvas: '243 246 252', surface: '255 255 255', ink: '17 24 39', muted: '100 112 135', line: '226 232 243' },
    dark: { canvas: '11 17 32', surface: '20 28 48', ink: '236 242 252', muted: '148 163 190', line: '38 50 76' },
  },
  {
    id: 'neutral',
    label: 'אפור',
    light: { canvas: '244 244 245', surface: '255 255 255', ink: '24 24 27', muted: '113 113 122', line: '228 228 231' },
    dark: { canvas: '9 9 11', surface: '24 24 27', ink: '244 244 245', muted: '161 161 170', line: '45 45 50' },
  },
  {
    id: 'warm',
    label: 'קרם',
    light: { canvas: '250 246 239', surface: '255 253 249', ink: '28 25 23', muted: '120 113 108', line: '235 228 216' },
    dark: { canvas: '20 17 15', surface: '32 28 25', ink: '250 247 244', muted: '168 162 156', line: '56 50 45' },
  },
  {
    id: 'mint',
    label: 'מנטה',
    light: { canvas: '240 248 244', surface: '255 255 255', ink: '17 29 24', muted: '98 118 108', line: '220 236 228' },
    dark: { canvas: '9 20 17', surface: '17 32 28', ink: '236 250 244', muted: '148 176 164', line: '32 56 49' },
  },
  {
    id: 'lavender',
    label: 'לבנדר',
    light: { canvas: '246 243 252', surface: '255 255 255', ink: '26 20 40', muted: '112 104 136', line: '232 226 244' },
    dark: { canvas: '16 12 28', surface: '27 21 46', ink: '243 239 252', muted: '164 156 190', line: '48 40 76' },
  },
];

export interface Appearance {
  theme: ThemePref;
  accent: AccentId;
  background: BackgroundId;
}

const hex = (rgb: string) => '#' + rgb.split(' ').map((n) => Number(n).toString(16).padStart(2, '0')).join('');

/** Every CSS variable that makes up a look, for the light or dark version of it. */
export function appearanceVars(accent: AccentId, background: BackgroundId, dark: boolean): Record<string, string> {
  const a = ACCENT_PRESETS.find((p) => p.id === accent) ?? ACCENT_PRESETS[0];
  const bg = BACKGROUND_PRESETS.find((p) => p.id === background) ?? BACKGROUND_PRESETS[0];
  const tone = dark ? bg.dark : bg.light;
  const vars: Record<string, string> = {
    '--canvas': tone.canvas,
    '--surface': tone.surface,
    '--ink': tone.ink,
    '--muted': tone.muted,
    '--line': tone.line,
  };
  SHADES.forEach((shade, i) => {
    vars[`--a-${shade}`] = a.a[i];
    vars[`--b-${shade}`] = a.b[i];
    vars[`--c-${shade}`] = a.c[i];
  });
  return vars;
}

export function applyAppearance(root: HTMLElement, look: Appearance, systemDark: boolean) {
  const dark = look.theme === 'dark' || (look.theme === 'system' && systemDark);
  root.classList.toggle('dark', dark);
  const vars = appearanceVars(look.accent, look.background, dark);
  for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', hex(vars['--canvas']));
}

const CACHE_KEY = 'noas-appearance';

/** Remember the look so the next launch paints it right away, before the data has loaded. */
export function cacheAppearance(look: Appearance) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(look));
  } catch {
    /* private mode etc. — fine, the look is applied once settings load */
  }
}

export function applyCachedAppearance() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return;
    const look = JSON.parse(raw) as Appearance;
    applyAppearance(document.documentElement, look, window.matchMedia('(prefers-color-scheme: dark)').matches);
  } catch {
    /* ignore */
  }
}
