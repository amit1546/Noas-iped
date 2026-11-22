import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { db } from '../db/db';
import { exportBackup } from '../db/backup';
import { addSomeday, markWorkDay, scheduleSomeday, setNoaDay, setWorkShift } from '../db/queries';

describe('work day marks', () => {
  it('marks a day as a work day with a shift in one go, and clears both together', async () => {
    await markWorkDay('2026-11-17', true, false, 'morning');
    let s = (await db.settings.get('main'))!;
    expect(s.workOverrides?.['2026-11-17']).toBe(true);
    expect(s.workShifts?.['2026-11-17']).toBe('morning');

    await setWorkShift('2026-11-17', 'evening');
    expect((await db.settings.get('main'))!.workShifts?.['2026-11-17']).toBe('evening');

    await markWorkDay('2026-11-17', false, false);
    s = (await db.settings.get('main'))!;
    expect(s.workOverrides?.['2026-11-17']).toBeUndefined();
    expect(s.workShifts?.['2026-11-17']).toBeUndefined();
  });

  it('marks days at Noa\'s independently of work', async () => {
    await setNoaDay('2026-11-18', true);
    expect((await db.settings.get('main'))!.noaDays?.['2026-11-18']).toBe(true);
    await setNoaDay('2026-11-18', false);
    expect((await db.settings.get('main'))!.noaDays?.['2026-11-18']).toBeUndefined();
  });
});

describe('general list', () => {
  it('turns an item into a task on a day, and the list keeps working in backups', async () => {
    const id = await addSomeday('לקנות מתנה', '2026-11-22');
    const item = (await db.someday.get(id))!;
    expect((await exportBackup(db)).data.someday).toHaveLength(1);
    await scheduleSomeday(item, '2026-11-25');
    expect(await db.someday.count()).toBe(0);
    const tasks = await db.tasks.where('date').equals('2026-11-25').toArray();
    expect(tasks.map((t) => t.title)).toEqual(['לקנות מתנה']);
  });
});
