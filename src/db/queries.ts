import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';
import {
  DEFAULT_SETTINGS,
  type FixedMeal,
  type Habit,
  type ISODate,
  type Meal,
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

/** Distinct workout names used before, for quick suggestions. */
export const useWorkoutNames = () =>
  useLiveQuery(async () => {
    const all = await db.workouts.toArray();
    return [...new Set(all.map((w) => w.title).filter(Boolean))];
  }, []) ?? [];

export const addWorkout = (w: { title: string; date: ISODate; time?: string }) =>
  db.workouts.add({ ...w, type: 'other', durationMin: 0, exercises: [], done: false });

export const setWorkoutDone = (id: number, done: boolean) => db.workouts.update(id, { done });
export const deleteWorkout = (id: number) => db.workouts.delete(id);

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
  await db.meals.add({
    date,
    mealType: fm.mealType,
    name: fm.name,
    calories: fm.calories,
    protein: fm.protein,
    fixedMealId: fm.id,
  });
  return true;
}

export const addMeal = (m: Omit<Meal, 'id'>) => db.meals.add(m);
export const updateMeal = (id: number, patch: Partial<Meal>) => db.meals.update(id, patch);

export function planFixedMeal(fm: FixedMeal, date: ISODate, time?: string) {
  return db.meals.add({
    date,
    mealType: fm.mealType,
    name: fm.name,
    calories: fm.calories,
    protein: fm.protein,
    fixedMealId: fm.id,
    planned: true,
    fromPlan: true,
    time,
  });
}
export const deleteMeal = (id: number) => db.meals.delete(id);

export const useBodyWeights = () =>
  useLiveQuery(() => db.bodyWeight.orderBy('date').toArray(), []) ?? [];

export const setBodyWeight = (date: ISODate, kg: number) => db.bodyWeight.put({ date, kg });
export const deleteBodyWeight = (date: ISODate) => db.bodyWeight.delete(date);
