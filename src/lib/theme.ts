import { useEffect } from 'react';
import type { ThemePref } from '../db/schema';

export function useApplyTheme(pref: ThemePref) {
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const dark = pref === 'dark' || (pref === 'system' && mq.matches);
      document.documentElement.classList.toggle('dark', dark);
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0f0e1a' : '#f6f5fb');
    };
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [pref]);
}
