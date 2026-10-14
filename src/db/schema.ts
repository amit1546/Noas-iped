export type ISODate = string; // yyyy-MM-dd

export type Priority = 'low' | 'medium' | 'high';

export interface Task {
  id?: number;
  title: string;
  date: ISODate;
  done: boolean;
  priority: Priority;
  notes?: string;
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
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface FixedMeal {
  id?: number;
  name: string;
  mealType: MealType;
  calories: number;
  protein: number;
  active: boolean;
  order: number;
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

export interface Settings {
  id: 'main';
  calorieGoal: number;
  proteinGoal: number;
  theme: ThemePref;
}

export const DEFAULT_SETTINGS: Settings = {
  id: 'main',
  calorieGoal: 2000,
  proteinGoal: 120,
  theme: 'system',
};

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: 'בוקר',
  lunch: 'צהריים',
  dinner: 'ערב',
  snack: 'נשנוש',
};

export const MEAL_TYPE_ORDER: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];
