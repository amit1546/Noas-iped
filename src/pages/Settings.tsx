import { Check, Download, Moon, Settings as SettingsIcon, ShieldCheck, Sun, Trash2, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { Button, Card, CardTitle, PageHeader, Segmented } from '../components/ui';
import { db } from '../db/db';
import { clearAll, exportBackup, importBackup, parseBackup, saveBackup } from '../db/backup';
import { formatShort, todayISO } from '../lib/dates';
import { updateSettings, useSettings } from '../db/queries';
import { ACCENT_PRESETS, BACKGROUND_PRESETS } from '../lib/appearance';
import type { ThemePref } from '../db/schema';

export function SettingsPage() {
  const settings = useSettings();
  // The background previews show the light or dark version, whichever the app is showing now.
  const dark = settings.theme === 'dark' || (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const onExport = async () => {
    if (!(await saveBackup(await exportBackup(db)))) return;
    await updateSettings({ lastBackupAt: todayISO() });
    setMsg({ ok: true, text: 'הגיבוי נשמר ✓' });
  };

  const onImport = async (file: File) => {
    try {
      const backup = parseBackup(await file.text());
      if (!confirm('הייבוא יחליף את כל הנתונים הקיימים במכשיר הזה. להמשיך?')) return;
      await importBackup(db, backup);
      setMsg({ ok: true, text: 'הגיבוי שוחזר בהצלחה 🎉' });
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message });
    }
  };

  const onClear = async () => {
    if (!confirm('למחוק את כל הנתונים? כדאי לייצא גיבוי קודם.')) return;
    if (!confirm('בטוח? אי אפשר לבטל את זה.')) return;
    await clearAll(db);
    setMsg({ ok: true, text: 'כל הנתונים נמחקו' });
  };

  return (
    <>
      <PageHeader title="הגדרות" accent="slate" icon={<SettingsIcon />} />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="lg:col-span-2">
          <CardTitle title="גיבוי והעברה למכשיר אחר" accent="sky" icon={<ShieldCheck size={18} />} />
          <p className="mb-4 text-sm text-muted">
            הנתונים נשמרים רק בדפדפן של המכשיר הזה. כדי להעביר אותם לטלפון או למחשב: לחץ "ייצוא גיבוי", שלח לעצמך את
            הקובץ (מייל / וואטסאפ / iCloud), פתח את האפליקציה במכשיר החדש ולחץ "ייבוא גיבוי".
          </p>
          <div className="flex flex-wrap gap-3">
            <Button accent="sky" onClick={onExport}>
              <Download size={18} /> ייצוא גיבוי
            </Button>
            <button className="btn-ghost border border-line" onClick={() => fileRef.current?.click()}>
              <Upload size={18} /> ייבוא גיבוי
            </button>
            <input
              ref={fileRef}
              type="file"
              // No file-type filter on purpose: on iPad/iPhone it greys out backups that arrived through
              // WhatsApp or mail without a recognised type. The contents are checked after choosing.
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onImport(f);
                e.target.value = '';
              }}
            />
          </div>
          <p className="mt-3 text-sm text-muted">
            {settings.lastBackupAt ? `גיבוי אחרון: ${formatShort(settings.lastBackupAt)}` : 'עוד לא גיבית'}
          </p>
          {msg && (
            <p className={`mt-3 text-sm font-semibold ${msg.ok ? 'text-emerald-600' : 'text-red-500'}`} role="status">
              {msg.text}
            </p>
          )}
        </Card>

        <Card className="p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 font-bold">
              {settings.theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />} מראה
            </h2>
            <Segmented<ThemePref>
              value={settings.theme}
              onChange={(theme) => updateSettings({ theme })}
              options={[
                { value: 'system', label: 'אוטומטי' },
                { value: 'light', label: 'בהיר' },
                { value: 'dark', label: 'כהה' },
              ]}
            />
          </div>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2" role="group" aria-label="צבע ראשי">
              <span className="w-9 text-sm text-muted">צבע</span>
              {ACCENT_PRESETS.map((p) => {
                const on = settings.accent === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => updateSettings({ accent: p.id })}
                    aria-pressed={on}
                    aria-label={`צבע ${p.label}`}
                    title={p.label}
                    className="grid h-8 w-8 place-items-center rounded-full text-white transition active:scale-90"
                    style={{
                      background: p.swatch,
                      boxShadow: on ? `0 0 0 2px rgb(var(--surface)), 0 0 0 4px ${p.swatch}` : 'none',
                    }}
                  >
                    {on && <Check size={16} strokeWidth={3} />}
                  </button>
                );
              })}
            </div>
            <div className="flex flex-wrap items-center gap-2" role="group" aria-label="צבע רקע">
              <span className="w-9 text-sm text-muted">רקע</span>
              {BACKGROUND_PRESETS.map((p) => {
                const on = settings.background === p.id;
                const tone = dark ? p.dark : p.light;
                return (
                  <button
                    key={p.id}
                    onClick={() => updateSettings({ background: p.id })}
                    aria-pressed={on}
                    aria-label={`רקע ${p.label}`}
                    title={p.label}
                    className="grid h-8 w-8 place-items-center rounded-full border border-black/15 transition active:scale-90"
                    style={{
                      background: `rgb(${tone.canvas})`,
                      boxShadow: on ? '0 0 0 2px rgb(var(--surface)), 0 0 0 4px rgb(var(--a-600))' : 'none',
                    }}
                  >
                    <span className="h-3.5 w-3.5 rounded-full border border-black/10" style={{ background: `rgb(${tone.surface})` }} />
                  </button>
                );
              })}
            </div>
          </div>
        </Card>

        <Card>
          <CardTitle title="מחיקת נתונים" accent="slate" icon={<Trash2 size={18} />} />
          <button className="btn border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-500/30 dark:hover:bg-red-500/10" onClick={onClear}>
            <Trash2 size={18} /> מחק את כל הנתונים
          </button>
        </Card>
      </div>
    </>
  );
}
