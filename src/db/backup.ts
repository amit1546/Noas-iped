import { TABLE_NAMES, type JournalDB } from './db';

export const BACKUP_APP_ID = 'noas-journal';
export const BACKUP_VERSION = 1;

export interface BackupFile {
  app: typeof BACKUP_APP_ID;
  version: number;
  exportedAt: string;
  data: Record<string, unknown[]>;
}

export async function exportBackup(database: JournalDB): Promise<BackupFile> {
  const data: Record<string, unknown[]> = {};
  for (const name of TABLE_NAMES) {
    data[name] = await database.table(name).toArray();
  }
  return {
    app: BACKUP_APP_ID,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data,
  };
}

export function parseBackup(text: string): BackupFile {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('הקובץ אינו קובץ JSON תקין');
  }
  const file = parsed as Partial<BackupFile>;
  if (!file || file.app !== BACKUP_APP_ID || typeof file.data !== 'object' || file.data === null) {
    throw new Error('זה לא קובץ גיבוי של היומן');
  }
  if ((file.version ?? 0) > BACKUP_VERSION) {
    throw new Error('קובץ הגיבוי נוצר בגרסה חדשה יותר של האפליקציה');
  }
  return file as BackupFile;
}

/** Replaces all existing data with the backup contents. */
export async function importBackup(database: JournalDB, backup: BackupFile): Promise<void> {
  const tables = TABLE_NAMES.map((n) => database.table(n));
  await database.transaction('rw', tables, async () => {
    for (const name of TABLE_NAMES) {
      const table = database.table(name);
      await table.clear();
      const rows = backup.data[name];
      if (Array.isArray(rows) && rows.length) {
        await table.bulkPut(rows);
      }
    }
  });
}

export async function clearAll(database: JournalDB): Promise<void> {
  const tables = TABLE_NAMES.map((n) => database.table(n));
  await database.transaction('rw', tables, async () => {
    for (const t of tables) await t.clear();
  });
}

export function downloadBackup(backup: BackupFile) {
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `journal-backup-${backup.exportedAt.slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
