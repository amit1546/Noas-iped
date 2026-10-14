import { Check, Pencil } from 'lucide-react';
import { useEffect, useState } from 'react';
import { updateSettings, useSettings } from '../db/queries';
import { calorieStatus, type DayTotals } from '../lib/stats';
import { ProgressBar, ProgressRing } from './ProgressRing';

const STATUS_COLOR = { under: '#10b981', near: '#f59e0b', over: '#ef4444' } as const;

export function CalorieSummary({ totals, editable = true }: { totals: DayTotals; editable?: boolean }) {
  const settings = useSettings();
  const goal = settings.calorieGoal;
  const remaining = goal - totals.calories;
  const status = calorieStatus(totals.calories, goal);
  const color = STATUS_COLOR[status];

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(goal));
  useEffect(() => setDraft(String(goal)), [goal]);

  const saveGoal = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const n = Math.round(Number(draft));
    if (n > 0) await updateSettings({ calorieGoal: n });
    setEditing(false);
  };

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
      <ProgressRing value={totals.calories} max={goal} color={color} size={168} stroke={16}>
        <div>
          <p className="text-xs font-medium text-muted">{remaining >= 0 ? 'נשאר' : 'חריגה'}</p>
          <p className="text-4xl font-extrabold tabular-nums" style={{ color }}>
            {Math.abs(remaining).toLocaleString('he-IL')}
          </p>
          <p className="text-xs text-muted">קלוריות</p>
        </div>
      </ProgressRing>

      <div className="w-full flex-1 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-canvas p-3">
            <p className="text-xs font-medium text-muted">נאכל</p>
            <p className="text-2xl font-extrabold tabular-nums">{totals.calories.toLocaleString('he-IL')}</p>
          </div>
          <div className="rounded-2xl bg-canvas p-3">
            <p className="text-xs font-medium text-muted">יעד יומי</p>
            {editing ? (
              <form onSubmit={saveGoal} className="flex items-center gap-1">
                <input
                  type="number"
                  inputMode="numeric"
                  className="w-full rounded-lg border border-line bg-surface px-2 py-1 text-xl font-extrabold"
                  value={draft}
                  autoFocus
                  onChange={(e) => setDraft(e.target.value)}
                  onBlur={() => saveGoal()}
                  aria-label="יעד קלורי יומי"
                />
                <button type="submit" aria-label="שמור יעד" className="p-1 text-emerald-600">
                  <Check size={20} />
                </button>
              </form>
            ) : (
              <button
                disabled={!editable}
                onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 text-2xl font-extrabold tabular-nums"
                aria-label="עריכת יעד קלורי"
              >
                {goal.toLocaleString('he-IL')}
                {editable && <Pencil size={14} className="text-muted" />}
              </button>
            )}
          </div>
        </div>
        <div>
          <div className="mb-1 flex justify-between text-sm">
            <span className="font-medium text-muted">חלבון</span>
            <span className="font-semibold tabular-nums">
              {totals.protein} / {settings.proteinGoal} גר׳
            </span>
          </div>
          <ProgressBar value={totals.protein} max={settings.proteinGoal} color="#8b5cf6" />
        </div>
        <p className="text-sm font-medium" style={{ color }}>
          {status === 'under' && 'יש לך עוד מקום — תהנה! 🥗'}
          {status === 'near' && 'כמעט ביעד — שים לב 👀'}
          {status === 'over' && 'עברת את היעד היום — מחר יום חדש 💪'}
        </p>
      </div>
    </div>
  );
}
