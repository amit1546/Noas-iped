import Dexie, { type Table } from 'dexie';
import type {
  BodyWeight,
  FixedMeal,
  Habit,
  HabitLog,
  Meal,
  Settings,
  Task,
  WaterLog,
  Workout,
} from './schema';

export class JournalDB extends Dexie {
  tasks!: Table<Task, number>;
  habits!: Table<Habit, number>;
  habitLogs!: Table<HabitLog, number>;
  workouts!: Table<Workout, number>;
  fixedMeals!: Table<FixedMeal, number>;
  meals!: Table<Meal, number>;
  waterLogs!: Table<WaterLog, string>;
  bodyWeight!: Table<BodyWeight, string>;
  settings!: Table<Settings, string>;

  constructor(name = 'noas-journal') {
    super(name);
    this.version(1).stores({
      tasks: '++id, date, done',
      habits: '++id, archived',
      habitLogs: '++id, habitId, date, [habitId+date]',
      workouts: '++id, date',
      fixedMeals: '++id, order',
      meals: '++id, date, fixedMealId',
      waterLogs: 'date',
      bodyWeight: 'date',
      settings: 'id',
    });
  }
}

export const db = new JournalDB();

export const TABLE_NAMES = [
  'tasks',
  'habits',
  'habitLogs',
  'workouts',
  'fixedMeals',
  'meals',
  'waterLogs',
  'bodyWeight',
  'settings',
] as const;

export type TableName = (typeof TABLE_NAMES)[number];
