import { Check, Flame, Pencil } from 'lucide-react';
import { useEffect, useState } from 'react';
import { updateSettings, useSettings } from '../db/queries';
import { calorieStatus, type DayTotals } from '../lib/stats';
import { ProgressBar } from './ProgressRing';

const STATUS_COLOR = { under: '#2563eb', near: '#f59e0b', over: '#ef4444' } as const;

/** Compact "eaten / left" calorie strip with an inline-editable daily goal. */
export function CalorieBar({ totals, planned = 0 }: { totals: DayTotals; planned?: number }) {
  const { calorieGoal: goal } = useSettings();
  const left = goal - totals.calories;
  const color = STATUS_COLOR[calorieStatus(totals.calories, goal)];
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(goal));
  useEffect(() => setDraft(String(goal)), [goal]);

  const save = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const n = Math.round(Number(draft));
    if (n > 0) await updateSettings({ calorieGoal: n });
    setEditing(false);
  };

  return (
    <div className="card mb-5 px-4 py-3">
      <div className="mb-2 flex items-center gap-3 text-sm">
        <Flame size={18} style={{ color }} className="shrink-0" />
        <span>
          אכלתי <b className="tabular-nums">{totals.calories.toLocaleString('he-IL')}</b>
        </span>
        <span className="text-line">|</span>
        <span>
          {left >= 0 ? 'נשאר ' : 'חריגה '}
          <b className="tabular-nums" style={{ color }}>
            {Math.abs(left).toLocaleString('he-IL')}
          </b>
        </span>
        <span className="ms-auto flex items-center gap-1 text-muted">
          יעד
          {editing ? (
            <form onSubmit={save} className="flex items-center">
              <input
                type="number"
                inputMode="numeric"
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={() => save()}
                className="w-16 rounded-lg border border-line bg-canvas px-1.5 py-0.5 text-center font-semibold text-ink"
                aria-label="יעד קלורי יומי"
              />
              <button type="submit" aria-label="שמור יעד" className="p-1 text-blue-600">
                <Check size={16} />
              </button>
            </form>
          ) : (
            <button onClick={() => setEditing(true)} className="flex items-center gap-1 font-semibold text-ink" aria-label="עריכת יעד קלורי">
              {goal.toLocaleString('he-IL')} <Pencil size={12} className="text-muted" />
            </button>
          )}
        </span>
      </div>
      <ProgressBar value={totals.calories} max={goal} color={color} />
      {planned > 0 && <p className="mt-1.5 text-xs text-muted">ועוד {planned.toLocaleString('he-IL')} קל׳ מתוכננות להיום</p>}
    </div>
  );
}
