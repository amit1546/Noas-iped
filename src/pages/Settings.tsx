import { Check, Download, Moon, Settings as SettingsIcon, ShieldCheck, Smartphone, Sun, Target, Trash2, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { Button, Card, CardTitle, PageHeader, Segmented } from '../components/ui';
import { db } from '../db/db';
import { clearAll, exportBackup, importBackup, parseBackup, saveBackup } from '../db/backup';
import { formatShort, todayISO } from '../lib/dates';
import { updateSettings, useSettings } from '../db/queries';
import { ACCENT_PRESETS, BACKGROUND_PRESETS } from '../lib/appearance';
import type { Settings, ThemePref } from '../db/schema';

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
        <Card>
          <CardTitle title="יעדים" accent="sky" icon={<Target size={18} />} />
          <div className="grid grid-cols-2 gap-3">
            <GoalInput label="קלוריות ליום" field="calorieGoal" settings={settings} />
            <GoalInput label="חלבון ליום (גר׳)" field="proteinGoal" settings={settings} />
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardTitle title="מראה" icon={settings.theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />} />
          <div className="space-y-5">
            <Segmented<ThemePref>
              value={settings.theme}
              onChange={(theme) => updateSettings({ theme })}
              options={[
                { value: 'system', label: 'אוטומטי' },
                { value: 'light', label: '☀️ בהיר' },
                { value: 'dark', label: '🌙 כהה' },
              ]}
            />
            <div>
              <p className="label">צבע ראשי</p>
              <div className="flex flex-wrap gap-3" role="group" aria-label="צבע ראשי">
                {ACCENT_PRESETS.map((p) => {
                  const on = settings.accent === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => updateSettings({ accent: p.id })}
                      aria-pressed={on}
                      aria-label={`צבע ${p.label}`}
                      title={p.label}
                      className="grid h-12 w-12 place-items-center rounded-full text-white transition active:scale-90"
                      style={{
                        background: p.swatch,
                        boxShadow: on ? `0 0 0 3px rgb(var(--surface)), 0 0 0 5px ${p.swatch}` : 'none',
                      }}
                    >
                      {on && <Check size={22} strokeWidth={3} />}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <p className="label">צבע רקע</p>
              <div className="flex flex-wrap gap-3" role="group" aria-label="צבע רקע">
                {BACKGROUND_PRESETS.map((p) => {
                  const on = settings.background === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => updateSettings({ background: p.id })}
                      aria-pressed={on}
                      aria-label={`רקע ${p.label}`}
                      className={`flex min-w-[84px] flex-col items-center gap-1.5 rounded-2xl border-2 p-2.5 transition active:scale-95 ${
                        on ? 'border-blue-600' : 'border-line'
                      }`}
                    >
                      <span
                        className="grid h-11 w-16 place-items-center rounded-xl border border-black/10"
                        style={{ background: `rgb(${(dark ? p.dark : p.light).canvas})` }}
                      >
                        <span
                          className="h-5 w-10 rounded-md border border-black/10"
                          style={{ background: `rgb(${(dark ? p.dark : p.light).surface})` }}
                        />
                      </span>
                      <span className="text-sm font-semibold">{p.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>

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
              accept="application/json,.json"
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

        <Card>
          <CardTitle title="התקנה כאפליקציה" accent="blue" icon={<Smartphone size={18} />} />
          <ol className="list-inside list-decimal space-y-1 text-sm text-muted">
            <li>פתח את האתר ב-Safari (באייפד / אייפון) או ב-Chrome (אנדרואיד / מחשב)</li>
            <li>לחץ על כפתור השיתוף ⬆️</li>
            <li>בחר "הוסף למסך הבית"</li>
          </ol>
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

type GoalField = 'calorieGoal' | 'proteinGoal';

function GoalInput({ label, field, settings }: { label: string; field: GoalField; settings: Settings }) {
  return (
    <label>
      <span className="label">{label}</span>
      <input
        key={settings[field]}
        className="input"
        type="number"
        inputMode="numeric"
        defaultValue={settings[field]}
        onBlur={(e) => {
          const n = Math.round(Number(e.target.value));
          if (n > 0 && n !== settings[field]) updateSettings({ [field]: n });
          else e.target.value = String(settings[field]);
        }}
      />
    </label>
  );
}
