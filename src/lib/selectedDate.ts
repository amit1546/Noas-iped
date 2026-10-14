import { useSyncExternalStore } from 'react';
import type { ISODate } from '../db/schema';
import { todayISO } from './dates';

// The day being viewed is shared between screens, so moving to "yesterday" on
// one tab keeps you on yesterday when switching tabs.
let current: ISODate = todayISO();
const listeners = new Set<() => void>();

export function setSelectedDate(d: ISODate) {
  current = d;
  listeners.forEach((l) => l());
}

export function useSelectedDate(): [ISODate, (d: ISODate) => void] {
  const d = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => current,
  );
  return [d, setSelectedDate];
}
