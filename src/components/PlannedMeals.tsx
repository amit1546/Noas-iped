import { AnimatePresence, motion } from 'framer-motion';
import { CalendarPlus, Check, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { deleteMeal, updateMeal, updateMealAmount } from '../db/queries';
import { MEAL_TYPE_LABELS, MEAL_TYPE_ORDER, type Meal } from '../db/schema';
import { amountSuffix } from '../lib/amount';
import { nutritionText } from '../lib/mealText';
import { MealDetails } from './MealDetails';
import { OptionalTime } from './OptionalTime';
import { IconButton } from './ui';
import { ItemCalendarButton } from './ItemCalendarButton';

export const byMealTime = (a: Meal, b: Meal) =>
  (a.time ?? '99:99').localeCompare(b.time ?? '99:99') ||
  MEAL_TYPE_ORDER.indexOf(a.mealType) - MEAL_TYPE_ORDER.indexOf(b.mealType);

/** A number you can change in place: how many grams / servings this meal is. */
function AmountInput({ meal }: { meal: Meal }) {
  const [v, setV] = useState(String(meal.amount ?? ''));
  useEffect(() => setV(String(meal.amount ?? '')), [meal.amount]);
  if (!meal.unit) return null;
  return (
    <label className="flex shrink-0 items-center gap-1 text-sm text-muted">
      <input
        type="number"
        inputMode="decimal"
        value={v}
        onChange={(e) => setV(e.target.value)}
        onBlur={() => updateMealAmount(meal, Number(v))}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        aria-label={`כמות ${meal.name}`}
        className="w-16 rounded-lg border border-line bg-surface px-1.5 py-1 text-center font-semibold text-ink"
      />
      {amountSuffix(meal.unit, meal.mealType === 'drink')}
    </label>
  );
}

/** Meals planned for a day, each with an editable time and an "I ate it" button. */
export function PlannedMeals({ meals, hint = true }: { meals: Meal[]; hint?: boolean }) {
  const planned = meals.filter((m) => m.planned).sort(byMealTime);
  if (!planned.length) {
    return (
      <p className="py-2 text-center text-sm text-muted">
        אין ארוחות מתוכננות
        {hint && (
          <>
            . אפשר לתכנן ארוחה חדשה או ללחוץ על <CalendarPlus size={14} className="inline" /> ליד ארוחה קבועה
          </>
        )}
      </p>
    );
  }
  return (
    <ul className="space-y-2">
      <AnimatePresence initial={false}>
        {planned.map((m) => (
          <motion.li
            key={m.id}
            layout
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-2xl border border-dashed border-sky-300 bg-sky-50/60 dark:border-sky-500/40 dark:bg-sky-500/5"
          >
            <div className="flex items-center gap-2 px-3 pt-2.5">
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{m.name}</span>
                <span className="text-xs text-muted">{[MEAL_TYPE_LABELS[m.mealType], nutritionText(m)].filter(Boolean).join(' · ')}</span>
              </span>
              <OptionalTime value={m.time ?? ''} onChange={(v) => updateMeal(m.id!, { time: v || undefined })} label={`שעה ל${m.name}`} />
            </div>
            <div className="flex items-center gap-1 py-1.5 pe-1 ps-3">
              {m.unit && <AmountInput meal={m} />}
              <span className="flex-1" />
              <ItemCalendarButton item={{ uid: `meal-${m.id}`, kind: 'meal', title: m.name, date: m.date, time: m.time }} />
              <IconButton label="הסר מהתכנון" onClick={() => deleteMeal(m.id!)}>
                <Trash2 size={18} />
              </IconButton>
              <button
                onClick={() => updateMeal(m.id!, { planned: false })}
                className="flex min-h-[40px] items-center gap-1 rounded-xl bg-sky-600 px-3 text-sm font-semibold text-white active:scale-95"
              >
                <Check size={16} /> אכלתי
              </button>
            </div>
            <MealDetails details={m.details} className="px-3 pb-2.5" />
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}
