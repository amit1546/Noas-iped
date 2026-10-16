import { useEffect } from 'react';
import type { Settings } from '../db/schema';
import { applyAppearance, cacheAppearance } from './appearance';

/** Applies the chosen mode, main color and background to the whole app, and keeps following the device's dark mode. */
export function useApplyAppearance({ theme, accent, background }: Pick<Settings, 'theme' | 'accent' | 'background'>) {
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => applyAppearance(document.documentElement, { theme, accent, background }, mq.matches);
    apply();
    cacheAppearance({ theme, accent, background });
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [theme, accent, background]);
}
