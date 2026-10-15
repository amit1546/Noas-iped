import Dexie, { type Table } from 'dexie';
import type {
  BodyWeight,
  FixedMeal,
  Habit,
  HabitLog,
  Meal,
  Reminder,
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
  reminders!: Table<Reminder, number>;
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
    // v2: reminders (notes tied to a date, not tasks)
    this.version(2).stores({ reminders: '++id, date' });
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
  'reminders',
  'waterLogs',
  'bodyWeight',
  'settings',
] as const;

export type TableName = (typeof TABLE_NAMES)[number];
