import { fixedMealTypes, MEAL_TYPE_ORDER, type FixedMeal } from '../db/schema';

const norm = (name: string) => name.trim().replace(/\s+/g, ' ').toLowerCase();

/** Groups of fixed meals that share a name (e.g. "פסטה" saved once for lunch and once for dinner). */
export function duplicateGroups(meals: FixedMeal[]): FixedMeal[][] {
  const byName = new Map<string, FixedMeal[]>();
  for (const m of meals) {
    const key = norm(m.name);
    if (!key) continue;
    byName.set(key, [...(byName.get(key) ?? []), m]);
  }
  return [...byName.values()].filter((g) => g.length > 1);
}

/** One meal that keeps the first one's identity and fits every time of day the group had. */
export function mergeGroup(group: FixedMeal[]): FixedMeal {
  const [first, ...rest] = [...group].sort((a, b) => a.order - b.order);
  const types = new Set(group.flatMap((m) => fixedMealTypes(m)));
  const ordered = MEAL_TYPE_ORDER.filter((t) => types.has(t));
  return {
    ...first,
    mealType: ordered[0] ?? first.mealType,
    mealTypes: ordered,
    // Keep what was entered: take the first non-empty value from the group.
    calories: [first, ...rest].map((m) => m.calories).find((c) => c > 0) ?? 0,
    protein: [first, ...rest].map((m) => m.protein).find((p) => p > 0) ?? 0,
    active: group.some((m) => m.active),
    details: group.map((m) => m.details).find((d) => d?.trim()),
  };
}
