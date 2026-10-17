export type ISODate = string; // yyyy-MM-dd

export type Priority = 'low' | 'medium' | 'high';

export interface Task {
  id?: number;
  title: string;
  date: ISODate;
  done: boolean;
  priority: Priority;
  notes?: string;
  /** Optional time of day, HH:mm */
  time?: string;
}

/** 0 = Sunday ... 6 = Saturday */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface Habit {
  id?: number;
  name: string;
  emoji: string;
  color: string;
  /** Empty array = every day */
  days: Weekday[];
  archived: boolean;
  createdAt: ISODate;
  /** Optional time of day, HH:mm */
  time?: string;
}

export interface HabitLog {
  id?: number;
  habitId: number;
  date: ISODate;
}

/** Legacy (feature removed); table kept so old backups still import. */
export type WorkoutType = 'strength' | 'cardio' | 'other';

export interface WorkoutSet {
  reps: number;
  weight: number;
}

export interface Exercise {
  name: string;
  sets: WorkoutSet[];
}

export interface Workout {
  id?: number;
  date: ISODate;
  type: WorkoutType;
  title: string;
  durationMin: number;
  notes?: string;
  exercises: Exercise[];
  /** Optional time of day, HH:mm */
  time?: string;
  /** Planned workouts are added with done=false; older entries without the flag count as done. */
  done?: boolean;
}

export const isWorkoutDone = (w: Pick<Workout, 'done'>) => w.done !== false;

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'drink';

/** Whether calories and protein are entered per serving or per 100 g (100 ml for drinks). */
export type MealUnit = 'serving' | 'per100';

export interface FixedMeal {
  id?: number;
  name: string;
  /** Primary type (kept for older saved data) */
  mealType: MealType;
  /** All the times of day this meal fits, e.g. lunch and dinner */
  mealTypes?: MealType[];
  calories: number;
  protein: number;
  active: boolean;
  order: number;
  /** What's in it, one ingredient per line */
  details?: string;
  /** What calories and protein refer to; older meals count as one serving */
  unit?: MealUnit;
}

export interface Meal {
  id?: number;
  date: ISODate;
  mealType: MealType;
  name: string;
  calories: number;
  protein: number;
  fixedMealId?: number;
  /** Planned for later in the day; doesn't count toward eaten totals until marked eaten. */
  planned?: boolean;
  /** Optional time of day, HH:mm */
  time?: string;
  /** Added through planning; stays on the day's checklist after it's eaten. */
  fromPlan?: boolean;
  /** What's in it, one ingredient per line */
  details?: string;
  /** How much was eaten: grams / ml for per-100 meals, number of servings otherwise. Calories and protein above are the totals for it. */
  unit?: MealUnit;
  amount?: number;
  /** Calories and protein per unit, so the amount can be changed later */
  perCalories?: number;
  perProtein?: number;
}

export interface Reminder {
  id?: number;
  date: ISODate;
  text: string;
  /** Optional time of day, HH:mm */
  time?: string;
}

/** Legacy (feature removed); table kept so old backups still import. */
export interface WaterLog {
  date: ISODate;
  glasses: number;
}

export interface BodyWeight {
  date: ISODate;
  kg: number;
}

export type ThemePref = 'system' | 'light' | 'dark';
export type AccentId = 'blue' | 'indigo' | 'violet' | 'pink' | 'red' | 'orange' | 'green' | 'teal' | 'graphite';
export type BackgroundId = 'cool' | 'neutral' | 'warm' | 'mint' | 'lavender';

export interface Settings {
  id: 'main';
  calorieGoal: number;
  proteinGoal: number;
  theme: ThemePref;
  /** Main color of the app */
  accent: AccentId;
  /** Page and card tones */
  background: BackgroundId;
  /** Date of the last backup export */
  lastBackupAt?: ISODate;
  /** Weekdays that are work days by default (0 = Sunday) */
  workDays: Weekday[];
  /** Per-date exceptions to workDays */
  workOverrides?: Record<ISODate, boolean>;
}

export const DEFAULT_SETTINGS: Settings = {
  id: 'main',
  calorieGoal: 2000,
  proteinGoal: 120,
  theme: 'system',
  accent: 'blue',
  background: 'cool',
  // Most people's work days aren't a fixed weekly pattern, so start with none and let them mark dates.
  workDays: [],
};

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: 'בוקר',
  lunch: 'צהריים',
  dinner: 'ערב',
  snack: 'נשנוש',
  drink: 'שתייה',
};

export const MEAL_TYPE_ORDER: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack', 'drink'];

/** The meal types a fixed meal can be planned for (older meals only have one). */
export const fixedMealTypes = (fm: Pick<FixedMeal, 'mealType' | 'mealTypes'>): MealType[] =>
  fm.mealTypes?.length ? MEAL_TYPE_ORDER.filter((t) => fm.mealTypes!.includes(t)) : [fm.mealType];
