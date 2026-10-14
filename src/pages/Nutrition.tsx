import { AnimatePresence, motion } from 'framer-motion';
import { Apple, BellRing, CalendarClock, CalendarPlus, Plus, Scale, Settings2, Trash2, UtensilsCrossed } from 'lucide-react';
import { useEffect, useState } from 'react';
import { BottomSheet } from '../components/BottomSheet';
import { CalorieSummary } from '../components/CalorieSummary';
import { Fab } from '../components/Fab';
import { FixedMealsManager } from '../components/FixedMealsManager';
import { byMealTime, PlannedMeals } from '../components/PlannedMeals';
import { Button, Card, CardTitle, CheckCircle, EmptyState, IconButton, PageHeader, Segmented } from '../components/ui';
import {
  addMeal,
  deleteMeal,
  planFixedMeal,
  saveFixedMeal,
  setBodyWeight,
  toggleFixedMealEaten,
  useBodyWeights,
  useFixedMeals,
  useMeals,
} from '../db/queries';
import { MEAL_TYPE_LABELS, MEAL_TYPE_ORDER, type MealType } from '../db/schema';
import { formatShort, todayISO } from '../lib/dates';
import { daysSince, downloadICS, weeklyReminderICS } from '../lib/reminder';
import { sumMeals } from '../lib/stats';

function defaultMealType(): MealType {
  const h = new Date().getHours();
  if (h < 11) return 'breakfast';
  if (h < 16) return 'lunch';
  if (h < 21) return 'dinner';
  return 'snack';
}

export function Nutrition() {
  const date = todayISO();
  const meals = useMeals(date);
  const fixedMeals = useFixedMeals();
  const [manageOpen, setManageOpen] = useState(false);
  const [sheet, setSheet] = useState<{ open: boolean; plan: boolean }>({ open: false, plan: false });

  const eaten = meals.filter((m) => !m.planned);
  const planned = meals.filter((m) => m.planned).sort(byMealTime);
  const totals = sumMeals(meals);
  const plannedCalories = planned.reduce((a, m) => a + m.calories, 0);
  const activeFixed = fixedMeals.filter((m) => m.active);
  const eatenFixedIds = new Set(eaten.map((m) => m.fixedMealId).filter((x): x is number => x != null));
  const plannedFixedIds = new Set(planned.map((m) => m.fixedMealId).filter((x): x is number => x != null));

  return (
    <>
      <PageHeader title="תזונה" subtitle="אוכלים חכם, מרגישים טוב" accent="sky" icon={<Apple />} />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="lg:col-span-2">
          <CalorieSummary totals={totals} planned={plannedCalories} />
        </Card>

        <Card className="lg:col-span-2">
          <CardTitle
            title="תכנון היום"
            accent="sky"
            icon={<CalendarClock size={18} />}
            action={
              <button className="chip text-muted hover:text-ink" onClick={() => setSheet({ open: true, plan: true })}>
                <Plus size={16} /> תכנון ארוחה
              </button>
            }
          />
          <PlannedMeals meals={meals} />
        </Card>

        <Card className="lg:col-span-2">
          <CardTitle
            title="ארוחות קבועות"
            accent="sky"
            icon={<UtensilsCrossed size={18} />}
            action={
              <button className="chip text-muted hover:text-ink" onClick={() => setManageOpen(true)}>
                <Settings2 size={16} /> ניהול
              </button>
            }
          />
          {activeFixed.length === 0 ? (
            <EmptyState
              emoji="🍳"
              title="אין עדיין ארוחות קבועות"
              text="הגדר את הארוחות שאתה אוכל בדרך כלל, ואז תסמן או תתכנן אותן בלחיצה אחת"
              action={
                <Button accent="sky" onClick={() => setManageOpen(true)}>
                  הוסף ארוחה קבועה
                </Button>
              }
            />
          ) : (
            <ul className="grid gap-2.5 lg:grid-cols-2">
              {activeFixed.map((fm) => {
                const isEaten = eatenFixedIds.has(fm.id!);
                const isPlanned = plannedFixedIds.has(fm.id!);
                return (
                  <li key={fm.id} className="flex items-stretch gap-1.5">
                    <button
                      onClick={() => toggleFixedMealEaten(fm, date)}
                      className="flex min-h-[72px] flex-1 items-center gap-3 rounded-2xl border-2 px-4 text-start transition active:scale-[0.98]"
                      style={{
                        borderColor: isEaten ? '#0ea5e9' : 'transparent',
                        background: isEaten ? '#0ea5e914' : 'rgb(var(--canvas))',
                      }}
                    >
                      <CheckCircle checked={isEaten} color="#0ea5e9" />
                      <span className="flex-1">
                        <span className="block text-lg font-semibold leading-tight">{fm.name}</span>
                        <span className="text-sm text-muted">
                          {MEAL_TYPE_LABELS[fm.mealType]}
                          {fm.protein ? ` · ${fm.protein} גר׳ חלבון` : ''}
                        </span>
                      </span>
                      <span className="text-end">
                        <span className="block text-lg font-bold tabular-nums">{fm.calories}</span>
                        <span className="text-xs text-muted">קל׳</span>
                      </span>
                    </button>
                    <button
                      onClick={() => planFixedMeal(fm, date)}
                      aria-label={`הוסף את ${fm.name} לתכנון`}
                      title="הוסף לתכנון היום"
                      className={`grid w-12 shrink-0 place-items-center rounded-2xl transition active:scale-95 ${
                        isPlanned ? 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300' : 'bg-canvas text-muted hover:text-ink'
                      }`}
                    >
                      <CalendarPlus size={20} />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <CardTitle
            title="מה אכלתי"
            accent="sky"
            icon={<Apple size={18} />}
            action={
              <IconButton label="הוסף ארוחה" onClick={() => setSheet({ open: true, plan: false })}>
                <Plus />
              </IconButton>
            }
          />
          {eaten.length === 0 ? (
            <EmptyState emoji="🥑" title="עוד לא נרשם אוכל היום" text="סמן ארוחה קבועה, סמן ארוחה מהתכנון, או הוסף ארוחה" />
          ) : (
            <div className="space-y-4">
              {MEAL_TYPE_ORDER.map((type) => {
                const list = eaten.filter((m) => m.mealType === type).sort(byMealTime);
                if (!list.length) return null;
                return (
                  <div key={type}>
                    <div className="mb-1.5 flex justify-between text-sm font-semibold text-muted">
                      <span>{MEAL_TYPE_LABELS[type]}</span>
                      <span className="tabular-nums">{sumMeals(list).calories} קל׳</span>
                    </div>
                    <ul className="space-y-1.5">
                      <AnimatePresence initial={false}>
                        {list.map((m) => (
                          <motion.li
                            key={m.id}
                            layout
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex items-center gap-2 rounded-2xl bg-canvas py-1 pe-1 ps-3"
                          >
                            {m.time && <span className="text-sm font-semibold tabular-nums text-sky-600 dark:text-sky-400">{m.time}</span>}
                            <span className="flex-1 font-medium">
                              {m.name}
                              {m.fixedMealId != null && (
                                <span className="ms-2 rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
                                  קבועה
                                </span>
                              )}
                            </span>
                            <span className="text-sm tabular-nums text-muted">
                              {m.calories} קל׳{m.protein ? ` · ${m.protein}ג׳` : ''}
                            </span>
                            <IconButton label="הסר ארוחה" onClick={() => deleteMeal(m.id!)}>
                              <Trash2 size={18} />
                            </IconButton>
                          </motion.li>
                        ))}
                      </AnimatePresence>
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      <WeightRow />

      <Fab accent="sky" label="הוסף ארוחה" onClick={() => setSheet({ open: true, plan: false })} />
      <AddMealSheet open={sheet.open} plan={sheet.plan} onClose={() => setSheet((s) => ({ ...s, open: false }))} date={date} />
      <FixedMealsManager open={manageOpen} onClose={() => setManageOpen(false)} />
    </>
  );
}

export function AddMealSheet({
  open,
  onClose,
  date,
  plan: initialPlan,
}: {
  open: boolean;
  onClose: () => void;
  date: string;
  plan: boolean;
}) {
  const [name, setName] = useState('');
  const [plan, setPlan] = useState(initialPlan);
  const [time, setTime] = useState('');
  const [mealType, setMealType] = useState<MealType>(defaultMealType);
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [saveAsFixed, setSaveAsFixed] = useState(false);

  useEffect(() => {
    if (open) {
      setName('');
      setCalories('');
      setProtein('');
      setSaveAsFixed(false);
      setMealType(defaultMealType());
      setPlan(initialPlan);
      setTime('');
    }
  }, [open, initialPlan]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || calories === '') return;
    const cal = Math.round(Number(calories) || 0);
    const prot = Math.round(Number(protein) || 0);
    let fixedMealId: number | undefined;
    if (saveAsFixed) {
      fixedMealId = await saveFixedMeal({ name: name.trim(), mealType, calories: cal, protein: prot, active: true });
    }
    await addMeal({
      date,
      mealType,
      name: name.trim(),
      calories: cal,
      protein: prot,
      fixedMealId,
      planned: plan || undefined,
      time: time || undefined,
    });
    onClose();
  };

  return (
    <BottomSheet open={open} onClose={onClose} title={plan ? 'תכנון ארוחה' : 'הוספת ארוחה'}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-1 rounded-2xl bg-canvas p-1">
          {[
            { v: false, l: 'אכלתי' },
            { v: true, l: 'מתכנן לאכול' },
          ].map((o) => (
            <button
              key={o.l}
              type="button"
              onClick={() => setPlan(o.v)}
              className={`min-h-[44px] rounded-xl font-semibold transition ${plan === o.v ? 'bg-surface shadow-soft' : 'text-muted'}`}
            >
              {o.l}
            </button>
          ))}
        </div>
        <div>
          <label className="label" htmlFor="meal-name">
            מה אכלת?
          </label>
          <input id="meal-name" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="לדוגמה: סלט עם טונה" />
        </div>
        <Segmented
          accent="sky"
          value={mealType}
          onChange={setMealType}
          options={MEAL_TYPE_ORDER.map((t) => ({ value: t, label: MEAL_TYPE_LABELS[t] }))}
        />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="meal-cal">
              קלוריות
            </label>
            <input id="meal-cal" className="input" type="number" inputMode="numeric" value={calories} onChange={(e) => setCalories(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="meal-protein">
              חלבון (גר׳)
            </label>
            <input id="meal-protein" className="input" type="number" inputMode="numeric" value={protein} onChange={(e) => setProtein(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="meal-time">
            שעה <span className="font-normal">(לא חובה)</span>
          </label>
          <input id="meal-time" className="input" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
        <label className="flex cursor-pointer items-center gap-3 rounded-2xl bg-canvas p-3.5">
          <input type="checkbox" className="h-5 w-5 accent-sky-600" checked={saveAsFixed} onChange={(e) => setSaveAsFixed(e.target.checked)} />
          <span className="font-medium">שמור גם כארוחה קבועה</span>
        </label>
        <Button accent="sky" type="submit" className="w-full" disabled={!name.trim() || calories === ''}>
          {plan ? 'הוסף לתכנון' : 'הוספה'}
        </Button>
      </form>
    </BottomSheet>
  );
}

function WeightRow() {
  const weights = useBodyWeights();
  const today = todayISO();
  const [date, setDate] = useState(today);
  const entry = weights.find((w) => w.date === date);
  const latest = weights[weights.length - 1];
  const prev = [...weights].reverse().find((w) => w.date < date);
  const [kg, setKg] = useState('');
  useEffect(() => setKg(entry ? String(entry.kg) : ''), [entry, date]);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const n = Number(kg);
    if (n > 0) setBodyWeight(date, Math.round(n * 10) / 10);
  };

  const diff = entry && prev ? Math.round((entry.kg - prev.kg) * 10) / 10 : null;
  const since = latest ? daysSince(latest.date, today) : null;
  const due = since == null || since >= 7;

  const addReminder = () => {
    const ics = weeklyReminderICS({
      title: '⚖️ שקילה שבועית — היומן שלי',
      weekday: new Date().getDay(),
      hour: 8,
      minute: 0,
      url: location.href.split('#')[0] + '#/nutrition',
    });
    downloadICS(ics, 'weekly-weigh-in.ics');
  };

  return (
    <Card className="mt-5 p-4">
      <form onSubmit={save} className="flex flex-wrap items-center gap-2">
        <Scale size={18} className="shrink-0 text-muted" />
        <span className="shrink-0 font-semibold">משקל</span>
        <input
          type="date"
          value={date}
          max={today}
          onChange={(e) => e.target.value && setDate(e.target.value)}
          className="rounded-xl border border-line bg-canvas px-2 py-1.5 text-sm"
          aria-label="תאריך השקילה"
        />
        <input
          className="w-20 rounded-xl border border-line bg-canvas px-2 py-1.5 text-center tabular-nums"
          type="number"
          step="0.1"
          inputMode="decimal"
          placeholder={latest ? String(latest.kg) : 'ק״ג'}
          value={kg}
          onChange={(e) => setKg(e.target.value)}
          aria-label="משקל בק״ג"
        />
        <span className="text-sm text-muted">ק״ג</span>
        {diff != null && (
          <span className={`text-xs font-semibold ${diff <= 0 ? 'text-emerald-600' : 'text-orange-500'}`}>
            {diff === 0 ? 'ללא שינוי' : `${diff > 0 ? '+' : ''}${diff}`}
          </span>
        )}
        <button
          type="submit"
          disabled={!kg || Number(kg) === entry?.kg}
          className="ms-auto rounded-xl px-3 py-1.5 text-sm font-semibold text-blue-600 disabled:opacity-40 dark:text-blue-400"
        >
          {entry ? 'עדכן' : 'שמור'}
        </button>
      </form>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-2 text-sm">
        <span className={due ? 'font-semibold text-amber-600 dark:text-amber-400' : 'text-muted'}>
          {latest
            ? `נשקלת לאחרונה ב-${formatShort(latest.date)} (${since === 0 ? 'היום' : `לפני ${since} ימים`})${due ? ' — הגיע הזמן להישקל' : ''}`
            : 'עוד לא נשקלת — כדאי להתחיל'}
        </span>
        <button type="button" onClick={addReminder} className="flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400">
          <BellRing size={15} /> תזכורת שבועית ביומן
        </button>
      </div>
    </Card>
  );
}
