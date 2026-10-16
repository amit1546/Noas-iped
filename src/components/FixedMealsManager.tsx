import { ChevronDown, ChevronUp, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { deleteFixedMeal, mergeFixedMeals, moveFixedMeal, saveFixedMeal, useFixedMeals } from '../db/queries';
import { fixedMealTypes, MEAL_TYPE_LABELS, MEAL_TYPE_ORDER, type FixedMeal, type MealType } from '../db/schema';
import { duplicateGroups, mergeGroup } from '../lib/fixedMeals';
import { nutritionText } from '../lib/mealText';
import { BottomSheet } from './BottomSheet';
import { Button, EmptyState, IconButton } from './ui';

const EMPTY = { name: '', mealTypes: ['breakfast'] as MealType[], calories: '', protein: '' };

export function FixedMealsManager({ open, onClose }: { open: boolean; onClose: () => void }) {
  const fixedMeals = useFixedMeals();
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState<number | undefined>();
  const duplicates = duplicateGroups(fixedMeals);

  const startEdit = (m: FixedMeal) => {
    setEditingId(m.id);
    setForm({ name: m.name, mealTypes: fixedMealTypes(m), calories: String(m.calories || ''), protein: String(m.protein || '') });
  };

  const reset = () => {
    setEditingId(undefined);
    setForm(EMPTY);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.mealTypes.length) return;
    const existing = fixedMeals.find((m) => m.id === editingId);
    await saveFixedMeal({
      id: editingId,
      name: form.name.trim(),
      mealType: form.mealTypes[0],
      mealTypes: form.mealTypes,
      calories: Math.round(Number(form.calories) || 0),
      protein: Math.round(Number(form.protein) || 0),
      active: existing?.active ?? true,
    });
    reset();
  };

  return (
    <BottomSheet
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="ניהול ארוחות קבועות"
    >
      {duplicates.map((group) => {
        const types = fixedMealTypes(mergeGroup(group)).map((t) => MEAL_TYPE_LABELS[t]).join(' / ');
        return (
          <div key={group[0].id} className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl bg-amber-50 p-3 text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
            <p className="min-w-0 flex-1 text-sm font-medium">
              יש {group.length} ארוחות קבועות בשם "{group[0].name}". אפשר לאחד לארוחה אחת שמתאימה ל{types}.
            </p>
            <button
              onClick={() => mergeFixedMeals(group)}
              className="min-h-[40px] rounded-xl bg-amber-600 px-4 text-sm font-bold text-white active:scale-95"
            >
              אחד לארוחה אחת
            </button>
          </div>
        );
      })}

      <form onSubmit={submit} className="mb-5 space-y-3 rounded-3xl bg-canvas p-4">
        <p className="font-semibold">{editingId ? 'עריכת ארוחה' : 'ארוחה קבועה חדשה'}</p>
        <input
          className="input bg-surface"
          placeholder="שם הארוחה"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          aria-label="שם הארוחה"
        />
        <div>
          <p className="mb-1.5 text-sm font-medium text-muted">מתאימה ל: (אפשר לבחור כמה)</p>
          <div className="flex flex-wrap gap-2">
            {MEAL_TYPE_ORDER.map((t) => {
              const on = form.mealTypes.includes(t);
              return (
                <button
                  type="button"
                  key={t}
                  aria-pressed={on}
                  onClick={() =>
                    setForm({
                      ...form,
                      // At least one type always stays selected.
                      mealTypes: on ? (form.mealTypes.length > 1 ? form.mealTypes.filter((x) => x !== t) : form.mealTypes) : [...form.mealTypes, t],
                    })
                  }
                  className={`chip ${on ? 'border-transparent bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300' : 'text-muted hover:text-ink'}`}
                >
                  {on && '✓ '}
                  {MEAL_TYPE_LABELS[t]}
                </button>
              );
            })}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input
            className="input bg-surface"
            type="number"
            inputMode="numeric"
            placeholder="קלוריות"
            value={form.calories}
            onChange={(e) => setForm({ ...form, calories: e.target.value })}
            aria-label="קלוריות"
          />
          <input
            className="input bg-surface"
            type="number"
            inputMode="numeric"
            placeholder="חלבון (גר׳)"
            value={form.protein}
            onChange={(e) => setForm({ ...form, protein: e.target.value })}
            aria-label="חלבון"
          />
        </div>
        <div className="flex gap-2">
          <Button accent="sky" type="submit" className="flex-1" disabled={!form.name.trim()}>
            {editingId ? 'שמירה' : 'הוספה'}
          </Button>
          {editingId && (
            <button type="button" className="btn-ghost" onClick={reset}>
              ביטול
            </button>
          )}
        </div>
      </form>

      {fixedMeals.length === 0 ? (
        <EmptyState emoji="🍽️" title="עוד אין ארוחות קבועות" text="הוסף ארוחות שאתה אוכל באופן קבוע כדי לרשום אותן בלחיצה" />
      ) : (
        <ul className="space-y-2">
          {fixedMeals.map((m, i) => (
            <li key={m.id} className={`flex items-center gap-1 rounded-2xl border border-line p-2 ps-3 ${m.active ? '' : 'opacity-50'}`}>
              <div className="flex-1">
                <p className="font-semibold">{m.name}</p>
                <p className="text-xs text-muted">
                  {[fixedMealTypes(m).map((t) => MEAL_TYPE_LABELS[t]).join(' / '), nutritionText(m, true)].filter(Boolean).join(' · ')}
                </p>
              </div>
              <label className="flex cursor-pointer items-center gap-1 px-1 text-xs text-muted">
                <input
                  type="checkbox"
                  className="h-5 w-5 accent-sky-600"
                  checked={m.active}
                  onChange={() => saveFixedMeal({ ...m, active: !m.active })}
                />
                פעילה
              </label>
              <div className="flex flex-col">
                <button aria-label="הזז למעלה" disabled={i === 0} onClick={() => moveFixedMeal(m.id!, -1)} className="px-1 text-muted disabled:opacity-30">
                  <ChevronUp size={18} />
                </button>
                <button aria-label="הזז למטה" disabled={i === fixedMeals.length - 1} onClick={() => moveFixedMeal(m.id!, 1)} className="px-1 text-muted disabled:opacity-30">
                  <ChevronDown size={18} />
                </button>
              </div>
              <IconButton label="עריכה" onClick={() => startEdit(m)}>
                <Pencil size={18} />
              </IconButton>
              <IconButton label="מחיקה" onClick={() => confirm(`למחוק את "${m.name}"?`) && deleteFixedMeal(m.id!)}>
                <Trash2 size={18} />
              </IconButton>
            </li>
          ))}
        </ul>
      )}
    </BottomSheet>
  );
}
