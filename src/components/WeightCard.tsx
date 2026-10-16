import { BellRing, Scale } from 'lucide-react';
import { useEffect, useState } from 'react';
import { setBodyWeight, useBodyWeights } from '../db/queries';
import { formatShort, todayISO } from '../lib/dates';
import { daysSince, sendICS, weeklyReminderICS } from '../lib/reminder';

export function WeightEntry() {
  const weights = useBodyWeights();
  const today = todayISO();
  const [date, setDate] = useState(today);
  const entry = weights.find((w) => w.date === date);
  const latest = weights[weights.length - 1];
  const prev = [...weights].reverse().find((w) => w.date < date);
  const [kg, setKg] = useState('');
  useEffect(() => setKg(entry ? String(entry.kg) : ''), [entry, date]);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const n = Number(kg);
    if (n > 0) setBodyWeight(date, Math.round(n * 10) / 10);
  };

  const diff = entry && prev ? Math.round((entry.kg - prev.kg) * 10) / 10 : null;
  const since = latest ? daysSince(latest.date, today) : null;
  const due = since == null || since >= 7;

  const addReminder = () => {
    const ics = weeklyReminderICS({
      title: '⚖️ שקילה שבועית — היומן שלי',
      weekday: new Date().getDay(),
      hour: 8,
      minute: 0,
      url: location.href.split('#')[0] + '#/dashboard',
    });
    sendICS(ics, 'weekly-weigh-in.ics');
  };

  return (
    <div>
      <form onSubmit={save} className="flex flex-wrap items-center gap-2">
        <Scale size={18} className="shrink-0 text-muted" />
        <span className="shrink-0 font-semibold">משקל</span>
        <input
          type="date"
          value={date}
          max={today}
          onChange={(e) => e.target.value && setDate(e.target.value)}
          className="rounded-xl border border-line bg-canvas px-2 py-1.5 text-sm"
          aria-label="תאריך השקילה"
        />
        <input
          className="w-20 rounded-xl border border-line bg-canvas px-2 py-1.5 text-center tabular-nums"
          type="number"
          step="0.1"
          inputMode="decimal"
          placeholder={latest ? String(latest.kg) : 'ק״ג'}
          value={kg}
          onChange={(e) => setKg(e.target.value)}
          aria-label="משקל בק״ג"
        />
        <span className="text-sm text-muted">ק״ג</span>
        {diff != null && (
          <span className={`text-xs font-semibold ${diff <= 0 ? 'text-emerald-600' : 'text-orange-500'}`}>
            {diff === 0 ? 'ללא שינוי' : `${diff > 0 ? '+' : ''}${diff}`}
          </span>
        )}
        <button
          type="submit"
          disabled={!kg || Number(kg) === entry?.kg}
          className="ms-auto rounded-xl px-3 py-1.5 text-sm font-semibold text-blue-600 disabled:opacity-40 dark:text-blue-400"
        >
          {entry ? 'עדכן' : 'שמור'}
        </button>
      </form>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-2 text-sm">
        <span className={due ? 'font-semibold text-amber-600 dark:text-amber-400' : 'text-muted'}>
          {latest
            ? `נשקלת לאחרונה ב-${formatShort(latest.date)} (${since === 0 ? 'היום' : `לפני ${since} ימים`})${due ? ' — הגיע הזמן להישקל' : ''}`
            : 'עוד לא נשקלת — כדאי להתחיל'}
        </span>
        <button type="button" onClick={addReminder} className="flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400">
          <BellRing size={15} /> תזכורת שבועית ביומן
        </button>
      </div>
    </div>
  );
}
