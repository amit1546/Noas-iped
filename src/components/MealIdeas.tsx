import { ChevronDown, Plus } from 'lucide-react';
import { useState } from 'react';
import { planFixedMeal } from '../db/queries';
import { fixedMealTypes, MEAL_TYPE_LABELS, MEAL_TYPE_ORDER, type FixedMeal, type ISODate, type MealType } from '../db/schema';
import { amountSuffix, unitOf } from '../lib/amount';
import { ingredientLines, nutritionText } from '../lib/mealText';

/**
 * The saved meals, split by time of day (breakfast / lunch / dinner / snack), so
 * "what should I eat now?" is a glance away. A meal that fits several times shows up
 * under each. Tapping one plans it for that time; the arrow opens what's in it.
 */
export function MealIdeas({ meals, date, onManage }: { meals: FixedMeal[]; date: ISODate; onManage: () => void }) {
  // Closed until a time of day is tapped, so the page isn't one long list.
  const [tab, setTab] = useState<MealType | null>(null);
  const [openId, setOpenId] = useState<number | null>(null);

  if (!meals.length) {
    return (
      <button
        onClick={onManage}
        className="mb-3 w-full rounded-2xl border-2 border-dashed border-line py-3 text-sm font-semibold text-muted hover:text-ink"
      >
        + הגדרת ארוחות קבועות לתכנון מהיר
      </button>
    );
  }

  const forType = (t: MealType) => meals.filter((m) => fixedMealTypes(m).includes(t));
  const list = tab ? forType(tab) : [];

  return (
    <div className="mb-4">
      <div className="mb-2 grid grid-cols-5 gap-1 rounded-2xl bg-canvas p-1" role="tablist" aria-label="זמן ארוחה">
        {MEAL_TYPE_ORDER.map((t) => {
          const count = forType(t).length;
          return (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => {
                setTab(tab === t ? null : t);
                setOpenId(null);
              }}
              className={`min-h-[44px] rounded-xl text-[13px] font-semibold transition sm:text-sm ${
                tab === t ? 'bg-surface text-sky-700 shadow-soft dark:text-sky-300' : 'text-muted'
              }`}
            >
              {MEAL_TYPE_LABELS[t]}
              {count > 0 && <span className="ms-1 text-xs font-medium opacity-70">{count}</span>}
            </button>
          );
        })}
      </div>

      {!tab ? null : list.length === 0 ? (
        <p className="py-3 text-center text-sm text-muted">אין עדיין ארוחות קבועות ל{MEAL_TYPE_LABELS[tab]}</p>
      ) : (
        <ul className="space-y-1.5">
          {list.map((fm) => {
            const lines = ingredientLines(fm.details);
            const open = openId === fm.id;
            return (
              <li key={fm.id} className="rounded-2xl bg-canvas">
                <div className="flex items-stretch">
                  <button
                    onClick={() => planFixedMeal(fm, date, undefined, tab!)}
                    aria-label={`תכנן ${fm.name} ל${MEAL_TYPE_LABELS[tab!]}`}
                    className="flex min-h-[52px] flex-1 items-center gap-2.5 px-3 text-start active:opacity-70"
                  >
                    <Plus size={18} className="shrink-0 text-sky-600 dark:text-sky-400" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{fm.name}</span>
                      {nutritionText(fm) && (
                        <span className="text-xs text-muted">
                          {nutritionText(fm)}
                          {unitOf(fm) === 'per100' && ` · ל־100 ${amountSuffix('per100', tab === 'drink')}`}
                        </span>
                      )}
                    </span>
                  </button>
                  {lines.length > 0 && (
                    <button
                      onClick={() => setOpenId(open ? null : fm.id!)}
                      aria-expanded={open}
                      aria-label={`מרכיבים של ${fm.name}`}
                      className="flex shrink-0 items-center gap-1 px-3 text-sm font-semibold text-muted hover:text-ink"
                    >
                      {lines.length} <ChevronDown size={16} className={`transition ${open ? 'rotate-180' : ''}`} />
                    </button>
                  )}
                </div>
                {open && (
                  <ul className="list-inside list-disc space-y-0.5 border-t border-line px-4 py-2.5 text-sm">
                    {lines.map((l, i) => (
                      <li key={i}>{l}</li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
