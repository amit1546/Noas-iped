export type Accent = 'violet' | 'orange' | 'emerald' | 'sky' | 'slate';

/** Literal class names per accent so Tailwind keeps them. */
export const ACCENT: Record<
  Accent,
  { bg: string; soft: string; text: string; ring: string; stroke: string; gradient: string; hex: string }
> = {
  violet: {
    bg: 'bg-violet-600 text-white hover:bg-violet-700',
    soft: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
    text: 'text-violet-600 dark:text-violet-400',
    ring: 'focus:ring-violet-400/20',
    stroke: '#8b5cf6',
    gradient: 'from-violet-500 to-fuchsia-500',
    hex: '#7c3aed',
  },
  orange: {
    bg: 'bg-orange-500 text-white hover:bg-orange-600',
    soft: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300',
    text: 'text-orange-600 dark:text-orange-400',
    ring: 'focus:ring-orange-400/20',
    stroke: '#f97316',
    gradient: 'from-orange-500 to-amber-400',
    hex: '#f97316',
  },
  emerald: {
    bg: 'bg-emerald-600 text-white hover:bg-emerald-700',
    soft: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
    text: 'text-emerald-600 dark:text-emerald-400',
    ring: 'focus:ring-emerald-400/20',
    stroke: '#10b981',
    gradient: 'from-emerald-500 to-teal-400',
    hex: '#059669',
  },
  sky: {
    bg: 'bg-sky-600 text-white hover:bg-sky-700',
    soft: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
    text: 'text-sky-600 dark:text-sky-400',
    ring: 'focus:ring-sky-400/20',
    stroke: '#0ea5e9',
    gradient: 'from-sky-500 to-indigo-500',
    hex: '#0284c7',
  },
  slate: {
    bg: 'bg-slate-700 text-white hover:bg-slate-800',
    soft: 'bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300',
    text: 'text-slate-600 dark:text-slate-300',
    ring: 'focus:ring-slate-400/20',
    stroke: '#64748b',
    gradient: 'from-slate-600 to-slate-400',
    hex: '#475569',
  },
};

export const HABIT_COLORS = ['#8b5cf6', '#ec4899', '#f97316', '#10b981', '#0ea5e9', '#eab308', '#ef4444', '#14b8a6'];
