import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { JournalDB } from '../db/db';
import { clearAll, exportBackup, importBackup, parseBackup } from '../db/backup';

describe('backup', () => {
  it('round-trips all data through export → clear → import', async () => {
    const db = new JournalDB('test-roundtrip');
    await db.tasks.add({ title: 'לקנות חלב', date: '2026-03-10', done: false, priority: 'medium' });
    const fmId = await db.fixedMeals.add({ name: 'שייק', mealType: 'breakfast', calories: 300, protein: 25, active: true, order: 1 });
    await db.meals.add({ date: '2026-03-10', mealType: 'breakfast', name: 'שייק', calories: 300, protein: 25, fixedMealId: fmId });
    await db.settings.put({ id: 'main', calorieGoal: 1800, proteinGoal: 140, waterGoal: 10, weeklyWorkoutGoal: 4, theme: 'dark' });

    const text = JSON.stringify(await exportBackup(db));
    await clearAll(db);
    expect(await db.tasks.count()).toBe(0);

    await importBackup(db, parseBackup(text));
    expect((await db.tasks.toArray())[0].title).toBe('לקנות חלב');
    expect((await db.meals.toArray())[0].fixedMealId).toBe(fmId);
    expect((await db.settings.get('main'))?.calorieGoal).toBe(1800);
  });

  it('rejects files that are not journal backups', () => {
    expect(() => parseBackup('not json')).toThrow();
    expect(() => parseBackup('{"foo":1}')).toThrow('זה לא קובץ גיבוי של היומן');
  });
});
