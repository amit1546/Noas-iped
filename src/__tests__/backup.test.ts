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
    await db.settings.put({ id: 'main', calorieGoal: 1800, proteinGoal: 140, theme: 'dark', workDays: [0, 1, 2, 3, 4] });

    const text = JSON.stringify(await exportBackup(db));
    await clearAll(db);
    expect(await db.tasks.count()).toBe(0);

    await importBackup(db, parseBackup(text));
    expect((await db.tasks.toArray())[0].title).toBe('לקנות חלב');
    expect((await db.meals.toArray())[0].fixedMealId).toBe(fmId);
    expect((await db.settings.get('main'))?.calorieGoal).toBe(1800);
  });

  it('keeps reminders and work-day exceptions in a backup', async () => {
    const db = new JournalDB('test-reminders');
    await db.reminders.add({ date: '2026-03-12', text: 'להתקשר לאמא', time: '18:00' });
    await db.settings.put({
      id: 'main',
      calorieGoal: 2000,
      proteinGoal: 120,
      theme: 'system',
      workDays: [1, 2],
      workOverrides: { '2026-03-12': false },
    });
    const text = JSON.stringify(await exportBackup(db));
    await clearAll(db);
    await importBackup(db, parseBackup(text));
    expect((await db.reminders.toArray())[0].text).toBe('להתקשר לאמא');
    expect((await db.settings.get('main'))?.workOverrides).toEqual({ '2026-03-12': false });
  });

  it('imports an older backup that has no reminders table', async () => {
    const db = new JournalDB('test-old-backup');
    await db.reminders.add({ date: '2026-03-12', text: 'ישן' });
    const old = {
      app: 'noas-journal',
      version: 1,
      exportedAt: '2026-01-01T00:00:00.000Z',
      data: { tasks: [{ id: 1, title: 'משימה', date: '2026-01-01', done: false, priority: 'low' }] },
    };
    await importBackup(db, parseBackup(JSON.stringify(old)));
    expect(await db.tasks.count()).toBe(1);
    expect(await db.reminders.count()).toBe(0);
  });

  it('rejects files that are not journal backups', () => {
    expect(() => parseBackup('not json')).toThrow();
    expect(() => parseBackup('{"foo":1}')).toThrow('זה לא קובץ גיבוי של היומן');
  });
});
