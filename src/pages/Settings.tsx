import { Download, Moon, Settings as SettingsIcon, ShieldCheck, Smartphone, Sun, Target, Trash2, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { Button, Card, CardTitle, PageHeader, Segmented } from '../components/ui';
import { db } from '../db/db';
import { clearAll, downloadBackup, exportBackup, importBackup, parseBackup } from '../db/backup';
import { updateSettings, useSettings } from '../db/queries';
import type { Settings, ThemePref } from '../db/schema';

export function SettingsPage() {
  const settings = useSettings();
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const onExport = async () => {
    downloadBackup(await exportBackup(db));
    setMsg({ ok: true, text: 'קובץ הגיבוי הורד ✓' });
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
          <CardTitle title="יעדים" accent="emerald" icon={<Target size={18} />} />
          <div className="grid grid-cols-2 gap-3">
            <GoalInput label="קלוריות ליום" field="calorieGoal" settings={settings} />
            <GoalInput label="חלבון ליום (גר׳)" field="proteinGoal" settings={settings} />
            <GoalInput label="כוסות מים ליום" field="waterGoal" settings={settings} />
            <GoalInput label="אימונים בשבוע" field="weeklyWorkoutGoal" settings={settings} />
          </div>
        </Card>

        <Card>
          <CardTitle title="מראה" icon={settings.theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />} />
          <Segmented<ThemePref>
            value={settings.theme}
            onChange={(theme) => updateSettings({ theme })}
            options={[
              { value: 'system', label: 'אוטומטי' },
              { value: 'light', label: '☀️ בהיר' },
              { value: 'dark', label: '🌙 כהה' },
            ]}
          />
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
          {msg && (
            <p className={`mt-3 text-sm font-semibold ${msg.ok ? 'text-emerald-600' : 'text-red-500'}`} role="status">
              {msg.text}
            </p>
          )}
        </Card>

        <Card>
          <CardTitle title="התקנה כאפליקציה" accent="violet" icon={<Smartphone size={18} />} />
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

type GoalField = 'calorieGoal' | 'proteinGoal' | 'waterGoal' | 'weeklyWorkoutGoal';

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
