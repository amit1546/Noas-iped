import { useEffect, useState } from 'react';
import { addHabit, updateHabit } from '../db/queries';
import type { Habit, Weekday } from '../db/schema';
import { HABIT_COLORS } from '../lib/accent';
import { todayISO } from '../lib/dates';
import { BottomSheet } from './BottomSheet';
import { Button } from './ui';

const EMOJIS = ['💧', '📚', '🧘', '🏃', '💪', '🥗', '😴', '🚭', '✍️', '🎯', '🙏', '🦷', '💊', '🌞', '🎸', '🧠'];
const DAYS: { d: Weekday; l: string }[] = [
  { d: 0, l: 'א' },
  { d: 1, l: 'ב' },
  { d: 2, l: 'ג' },
  { d: 3, l: 'ד' },
  { d: 4, l: 'ה' },
  { d: 5, l: 'ו' },
  { d: 6, l: 'ש' },
];

export function HabitForm({
  open,
  onClose,
  habit,
  initialName = '',
}: {
  open: boolean;
  onClose: () => void;
  habit?: Habit;
  initialName?: string;
}) {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState(EMOJIS[0]);
  const [color, setColor] = useState(HABIT_COLORS[0]);
  const [days, setDays] = useState<Weekday[]>([]);
  const [time, setTime] = useState('');

  useEffect(() => {
    if (!open) return;
    setName(habit?.name ?? initialName);
    setTime(habit?.time ?? '');
    setEmoji(habit?.emoji ?? EMOJIS[0]);
    setColor(habit?.color ?? HABIT_COLORS[0]);
    setDays(habit?.days ?? []);
  }, [open, habit, initialName]);

  const toggleDay = (d: Weekday) =>
    setDays((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d].sort()));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    // Selecting all 7 days is the same as "every day".
    const normalized = days.length === 7 ? [] : days;
    const fields = { name: name.trim(), emoji, color, days: normalized, time: time || undefined };
    if (habit?.id) await updateHabit(habit.id, fields);
    else await addHabit({ ...fields, archived: false, createdAt: todayISO() });
    onClose();
  };

  return (
    <BottomSheet open={open} onClose={onClose} title={habit ? 'עריכת הרגל' : 'הרגל חדש'}>
      <form onSubmit={save} className="space-y-5">
        <div>
          <label className="label" htmlFor="habit-name">
            שם ההרגל
          </label>
          <input
            id="habit-name"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="שם ההרגל"
            
          />
        </div>
        <div>
          <span className="label">באילו ימים? {days.length === 0 && <span className="text-blue-600">(כל יום)</span>}</span>
          <div className="flex gap-1.5">
            {DAYS.map(({ d, l }) => (
              <button
                type="button"
                key={d}
                onClick={() => toggleDay(d)}
                aria-pressed={days.includes(d)}
                aria-label={`יום ${l}`}
                className={`h-11 flex-1 rounded-xl font-bold transition ${
                  days.includes(d) ? 'text-white' : 'bg-canvas text-muted'
                }`}
                style={days.includes(d) ? { background: color } : undefined}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="label" htmlFor="habit-time">
            שעה <span className="font-normal">(לא חובה)</span>
          </label>
          <div className="flex gap-2">
            <input id="habit-time" type="time" className="input" value={time} onChange={(e) => setTime(e.target.value)} />
            {time && (
              <button type="button" className="btn-ghost shrink-0" onClick={() => setTime('')}>
                נקה
              </button>
            )}
          </div>
        </div>
        <div>
          <span className="label">אייקון</span>
          <div className="grid grid-cols-8 gap-1.5">
            {EMOJIS.map((e) => (
              <button
                type="button"
                key={e}
                onClick={() => setEmoji(e)}
                className={`grid h-11 place-items-center rounded-xl text-xl transition ${
                  emoji === e ? 'bg-blue-100 ring-2 ring-blue-500 dark:bg-blue-500/20' : 'bg-canvas'
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>
        <div>
          <span className="label">צבע</span>
          <div className="flex flex-wrap gap-2.5">
            {HABIT_COLORS.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setColor(c)}
                aria-label={`צבע ${c}`}
                className="h-10 w-10 rounded-full transition"
                style={{ background: c, boxShadow: color === c ? `0 0 0 3px rgb(var(--surface)), 0 0 0 5px ${c}` : 'none' }}
              />
            ))}
          </div>
        </div>
        <Button type="submit" className="w-full" disabled={!name.trim()}>
          {habit ? 'שמירה' : 'הוספת הרגל'}
        </Button>
      </form>
    </BottomSheet>
  );
}
