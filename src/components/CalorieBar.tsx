import { Check, Flame, Pencil } from 'lucide-react';
import { useEffect, useState } from 'react';
import { updateSettings, useSettings } from '../db/queries';
import { ACCENT_600 } from '../lib/appearance';
import { calorieStatus, type DayTotals } from '../lib/stats';
import { ProgressBar } from './ProgressRing';

const STATUS_COLOR = { under: ACCENT_600, near: '#f59e0b', over: '#ef4444' } as const;

/** A number you tap to edit in place (used for the daily calorie and protein goals). */
function InlineGoal({ value, label, onSave }: { value: number; label: string; onSave: (n: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);

  const save = (e?: React.FormEvent) => {
    e?.preventDefault();
    const n = Math.round(Number(draft));
    if (n > 0 && n !== value) onSave(n);
    else setDraft(String(value));
    setEditing(false);
  };

  if (!editing) {
    return (
      <button onClick={() => setEditing(true)} className="flex items-center gap-1 font-semibold text-ink" aria-label={`עריכת ${label}`}>
        {value.toLocaleString('he-IL')} <Pencil size={12} className="text-muted" />
      </button>
    );
  }
  return (
    <form onSubmit={save} className="flex items-center">
      <input
        type="number"
        inputMode="numeric"
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => save()}
        className="w-16 rounded-lg border border-line bg-canvas px-1.5 py-0.5 text-center font-semibold text-ink"
        aria-label={label}
      />
      <button type="submit" aria-label={`שמור ${label}`} className="p-1 text-blue-600">
        <Check size={16} />
      </button>
    </form>
  );
}

/** Compact "eaten / left" calorie strip, with protein, and daily goals you can edit in place. */
export function CalorieBar({ totals, planned = 0 }: { totals: DayTotals; planned?: number }) {
  const { calorieGoal: goal, proteinGoal } = useSettings();
  const left = goal - totals.calories;
  const color = STATUS_COLOR[calorieStatus(totals.calories, goal)];

  return (
    <div className="card mt-5 px-4 py-3">
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
          <InlineGoal value={goal} label="יעד קלורי יומי" onSave={(n) => updateSettings({ calorieGoal: n })} />
        </span>
      </div>
      <ProgressBar value={totals.calories} max={goal} color={color} />
      <div className="mb-1 mt-2.5 flex items-center gap-2 text-sm">
        <span className="font-medium text-muted">חלבון</span>
        <span className="ms-auto flex items-center gap-1 tabular-nums">
          <b>{totals.protein}</b>
          <span className="text-muted">/</span>
          <InlineGoal value={proteinGoal} label="יעד חלבון יומי" onSave={(n) => updateSettings({ proteinGoal: n })} />
          <span className="text-muted">גר׳</span>
        </span>
      </div>
      <ProgressBar value={totals.protein} max={proteinGoal} color="#7c3aed" />
      {planned > 0 && <p className="mt-1.5 text-xs text-muted">ועוד {planned.toLocaleString('he-IL')} קל׳ מתוכננות להיום</p>}
    </div>
  );
}
