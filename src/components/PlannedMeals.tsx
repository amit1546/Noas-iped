import { AnimatePresence, motion } from 'framer-motion';
import { CalendarPlus, Check, Trash2 } from 'lucide-react';
import { deleteMeal, updateMeal } from '../db/queries';
import { MEAL_TYPE_LABELS, MEAL_TYPE_ORDER, type Meal } from '../db/schema';
import { IconButton } from './ui';

export const byMealTime = (a: Meal, b: Meal) =>
  (a.time ?? '99:99').localeCompare(b.time ?? '99:99') ||
  MEAL_TYPE_ORDER.indexOf(a.mealType) - MEAL_TYPE_ORDER.indexOf(b.mealType);

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
            className="flex items-center gap-2 rounded-2xl border border-dashed border-sky-300 bg-sky-50/60 py-1.5 pe-1 ps-2 dark:border-sky-500/40 dark:bg-sky-500/5"
          >
            <input
              type="time"
              value={m.time ?? ''}
              onChange={(e) => updateMeal(m.id!, { time: e.target.value || undefined })}
              className="w-[108px] shrink-0 rounded-xl border border-line bg-surface px-1.5 py-1.5 text-center text-sm font-semibold tabular-nums"
              aria-label={`שעה ל${m.name}`}
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold">{m.name}</span>
              <span className="text-xs text-muted">
                {MEAL_TYPE_LABELS[m.mealType]} · {m.calories} קל׳
              </span>
            </span>
            <button
              onClick={() => updateMeal(m.id!, { planned: false })}
              className="flex min-h-[40px] items-center gap-1 rounded-xl bg-sky-600 px-3 text-sm font-semibold text-white active:scale-95"
            >
              <Check size={16} /> אכלתי
            </button>
            <IconButton label="הסר מהתכנון" onClick={() => deleteMeal(m.id!)}>
              <Trash2 size={18} />
            </IconButton>
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}
