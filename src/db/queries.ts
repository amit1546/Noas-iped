import { useLiveQuery } from 'dexie-react-hooks';
import { defaultAmount, scaleNutrition, unitOf } from '../lib/amount';
import { mergeGroup } from '../lib/fixedMeals';
import { db } from './db';
import {
  DEFAULT_SETTINGS,
  type FixedMeal,
  type Habit,
  type ISODate,
  type Meal,
  type MealType,
  type Reminder,
  type Settings,
  type Task,
} from './schema';

/* ---------- settings ---------- */

export function useSettings(): Settings {
  const s = useLiveQuery(() => db.settings.get('main'), []);
  return { ...DEFAULT_SETTINGS, ...s };
}

export async function updateSettings(patch: Partial<Omit<Settings, 'id'>>) {
  const current = (await db.settings.get('main')) ?? DEFAULT_SETTINGS;
  await db.settings.put({ ...current, ...patch, id: 'main' });
}

/* ---------- tasks ---------- */

export const useTasks = (date: ISODate) =>
  useLiveQuery(() => db.tasks.where('date').equals(date).toArray(), [date]) ?? [];

export const addTask = (t: Omit<Task, 'id'>) => db.tasks.add(t);

/** Unfinished tasks from days before `today`, newest first. */
export const useOverdueTasks = (today: ISODate) =>
  useLiveQuery(
    async () => (await db.tasks.where('date').below(today).filter((t) => !t.done).toArray()).sort((a, b) => b.date.localeCompare(a.date)),
    [today],
  ) ?? [];

/** True once anything worth backing up has been saved. */
export const useHasData = () =>
  useLiveQuery(async () => (await db.tasks.count()) + (await db.habits.count()) + (await db.meals.count()) + (await db.workouts.count()) > 0, []) ??
  false;
export const toggleTask = (t: Task) => db.tasks.update(t.id!, { done: !t.done });
export const deleteTask = (id: number) => db.tasks.delete(id);
export const moveTask = (id: number, date: ISODate) => db.tasks.update(id, { date });

/* ---------- habits ---------- */

export const useHabits = (includeArchived = false) =>
  useLiveQuery(
    async () => {
      const all = await db.habits.toArray();
      return includeArchived ? all : all.filter((h) => !h.archived);
    },
    [includeArchived],
  ) ?? [];

export const useHabitLogsBetween = (from: ISODate, to: ISODate) =>
  useLiveQuery(() => db.habitLogs.where('date').between(from, to, true, true).toArray(), [from, to]) ?? [];

export const useTasksBetween = (from: ISODate, to: ISODate) =>
  useLiveQuery(() => db.tasks.where('date').between(from, to, true, true).toArray(), [from, to]) ?? [];

export const useAllHabitLogs = () => useLiveQuery(() => db.habitLogs.toArray(), []) ?? [];

export const addHabit = (h: Omit<Habit, 'id'>) => db.habits.add(h);
export const updateHabit = (id: number, patch: Partial<Habit>) => db.habits.update(id, patch);
export async function deleteHabit(id: number) {
  await db.transaction('rw', db.habits, db.habitLogs, async () => {
    await db.habitLogs.where('habitId').equals(id).delete();
    await db.habits.delete(id);
  });
}

/** Returns true if the habit is now marked done. */
export async function toggleHabit(habitId: number, date: ISODate): Promise<boolean> {
  const existing = await db.habitLogs.where({ habitId, date }).first();
  if (existing) {
    await db.habitLogs.delete(existing.id!);
    return false;
  }
  await db.habitLogs.add({ habitId, date });
  return true;
}

/* ---------- workouts (simple "did I work out" days) ---------- */

export const useWorkoutsBetween = (from: ISODate, to: ISODate) =>
  useLiveQuery(() => db.workouts.where('date').between(from, to, true, true).toArray(), [from, to]) ?? [];

export const useWorkoutsOn = (date: ISODate) =>
  useLiveQuery(() => db.workouts.where('date').equals(date).toArray(), [date]) ?? [];

export const addWorkout = (w: { title: string; date: ISODate; time?: string }) =>
  db.workouts.add({ ...w, type: 'other', durationMin: 0, exercises: [], done: false });

export const setWorkoutDone = (id: number, done: boolean) => db.workouts.update(id, { done });
export const deleteWorkout = (id: number) => db.workouts.delete(id);

/* ---------- reminders ---------- */

export const useReminders = (date: ISODate) =>
  useLiveQuery(() => db.reminders.where('date').equals(date).toArray(), [date]) ?? [];

export const useRemindersBetween = (from: ISODate, to: ISODate) =>
  useLiveQuery(() => db.reminders.where('date').between(from, to, true, true).toArray(), [from, to]) ?? [];

export const addReminder = (r: Omit<Reminder, 'id'>) => db.reminders.add(r);
export const deleteReminder = (id: number) => db.reminders.delete(id);

/* ---------- work days ---------- */

/** Turns a single date into a work day or a day off, overriding the weekly pattern. */
export async function setWorkDayOverride(date: ISODate, isWork: boolean, weeklyDefault: boolean) {
  const current = (await db.settings.get('main')) ?? DEFAULT_SETTINGS;
  const overrides = { ...(current.workOverrides ?? {}) };
  // Matching the weekly pattern needs no exception.
  if (isWork === weeklyDefault) delete overrides[date];
  else overrides[date] = isWork;
  await db.settings.put({ ...current, workOverrides: overrides, id: 'main' });
}

/* ---------- nutrition ---------- */

export const useFixedMeals = () =>
  useLiveQuery(() => db.fixedMeals.orderBy('order').toArray(), []) ?? [];

export const useMeals = (date: ISODate) =>
  useLiveQuery(() => db.meals.where('date').equals(date).toArray(), [date]) ?? [];

export const useMealsBetween = (from: ISODate, to: ISODate) =>
  useLiveQuery(() => db.meals.where('date').between(from, to, true, true).toArray(), [from, to]) ?? [];

export async function saveFixedMeal(m: Omit<FixedMeal, 'id' | 'order'> & { id?: number; order?: number }) {
  if (m.id != null) {
    await db.fixedMeals.update(m.id, m);
    return m.id;
  }
  const last = await db.fixedMeals.orderBy('order').last();
  return db.fixedMeals.add({ ...m, order: (last?.order ?? 0) + 1 } as FixedMeal);
}

export const deleteFixedMeal = (id: number) => db.fixedMeals.delete(id);

/** Folds fixed meals that share a name into one that fits all their times of day. */
export async function mergeFixedMeals(group: FixedMeal[]) {
  if (group.length < 2) return;
  const merged = mergeGroup(group);
  const removeIds = group.map((m) => m.id!).filter((id) => id !== merged.id);
  await db.transaction('rw', db.fixedMeals, db.meals, async () => {
    await db.fixedMeals.put(merged);
    await db.meals.where('fixedMealId').anyOf(removeIds).modify({ fixedMealId: merged.id });
    await db.fixedMeals.bulkDelete(removeIds);
  });
}

export async function moveFixedMeal(id: number, dir: -1 | 1) {
  const all = await db.fixedMeals.orderBy('order').toArray();
  const i = all.findIndex((m) => m.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= all.length) return;
  await db.transaction('rw', db.fixedMeals, async () => {
    await db.fixedMeals.update(all[i].id!, { order: all[j].order });
    await db.fixedMeals.update(all[j].id!, { order: all[i].order });
  });
}

/** Marks a fixed meal as eaten on the date, or un-marks it if already logged. */
export async function toggleFixedMealEaten(fm: FixedMeal, date: ISODate): Promise<boolean> {
  const existing = await db.meals
    .where('date')
    .equals(date)
    .filter((m) => m.fixedMealId === fm.id && !m.planned)
    .first();
  if (existing) {
    await db.meals.delete(existing.id!);
    return false;
  }
  await db.meals.add({ ...mealFromFixed(fm, fm.mealType), date, fixedMealId: fm.id });
  return true;
}

export const addMeal = (m: Omit<Meal, 'id'>) => db.meals.add(m);
export const updateMeal = (id: number, patch: Partial<Meal>) => db.meals.update(id, patch);

/** A meal with the fixed meal's values for its default amount (100 g, or one serving). */
function mealFromFixed(fm: FixedMeal, mealType: MealType) {
  const unit = unitOf(fm);
  const amount = defaultAmount(unit);
  return {
    mealType,
    name: fm.name,
    ...scaleNutrition(fm, unit, amount),
    details: fm.details,
    unit,
    amount,
    perCalories: fm.calories,
    perProtein: fm.protein,
  };
}

export function planFixedMeal(fm: FixedMeal, date: ISODate, time?: string, mealType: MealType = fm.mealType) {
  return db.meals.add({ ...mealFromFixed(fm, mealType), date, fixedMealId: fm.id, planned: true, fromPlan: true, time });
}

/** Changes how much was eaten and recalculates calories and protein from the per-unit values. */
export async function updateMealAmount(m: Meal, amount: number) {
  if (!m.unit || !(amount > 0)) return;
  const per = { calories: m.perCalories ?? m.calories, protein: m.perProtein ?? m.protein };
  await db.meals.update(m.id!, { amount, ...scaleNutrition(per, m.unit, amount) });
}
export const deleteMeal = (id: number) => db.meals.delete(id);

export const useBodyWeights = () =>
  useLiveQuery(() => db.bodyWeight.orderBy('date').toArray(), []) ?? [];

export const setBodyWeight = (date: ISODate, kg: number) => db.bodyWeight.put({ date, kg });
export const deleteBodyWeight = (date: ISODate) => db.bodyWeight.delete(date);
