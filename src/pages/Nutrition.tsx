import { AnimatePresence, motion } from 'framer-motion';
import { Apple, Droplets, Minus, Plus, Scale, Settings2, Trash2, UtensilsCrossed } from 'lucide-react';
import { useEffect, useState } from 'react';
import { BottomSheet } from '../components/BottomSheet';
import { CalorieSummary } from '../components/CalorieSummary';
import { DateNav } from '../components/DateNav';
import { Fab } from '../components/Fab';
import { FixedMealsManager } from '../components/FixedMealsManager';
import { Button, Card, CardTitle, CheckCircle, EmptyState, IconButton, PageHeader, Segmented } from '../components/ui';
import {
  addMeal,
  deleteMeal,
  saveFixedMeal,
  setBodyWeight,
  setWater,
  toggleFixedMealEaten,
  useBodyWeights,
  useFixedMeals,
  useMeals,
  useSettings,
  useWater,
} from '../db/queries';
import { MEAL_TYPE_LABELS, MEAL_TYPE_ORDER, type MealType } from '../db/schema';
import { useSelectedDate } from '../lib/selectedDate';
import { sumMeals } from '../lib/stats';

function defaultMealType(): MealType {
  const h = new Date().getHours();
  if (h < 11) return 'breakfast';
  if (h < 16) return 'lunch';
  if (h < 21) return 'dinner';
  return 'snack';
}

export function Nutrition() {
  const [date, setDate] = useSelectedDate();
  const meals = useMeals(date);
  const fixedMeals = useFixedMeals();
  const [manageOpen, setManageOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  const totals = sumMeals(meals);
  const activeFixed = fixedMeals.filter((m) => m.active);
  const eatenFixedIds = new Set(meals.map((m) => m.fixedMealId).filter((x): x is number => x != null));

  return (
    <>
      <PageHeader title="תזונה" subtitle="אוכלים חכם, מרגישים טוב" accent="emerald" icon={<Apple />} />
      <DateNav date={date} onChange={setDate} />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="lg:col-span-2">
          <CalorieSummary totals={totals} />
        </Card>

        <Card>
          <CardTitle
            title="ארוחות קבועות"
            accent="emerald"
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
              text="הגדר את הארוחות שאתה אוכל בדרך כלל, ואז תסמן אותן בלחיצה אחת"
              action={
                <Button accent="emerald" onClick={() => setManageOpen(true)}>
                  הוסף ארוחה קבועה
                </Button>
              }
            />
          ) : (
            <ul className="space-y-2">
              {activeFixed.map((fm) => {
                const eaten = eatenFixedIds.has(fm.id!);
                return (
                  <li key={fm.id}>
                    <button
                      onClick={() => toggleFixedMealEaten(fm, date)}
                      className="flex min-h-[60px] w-full items-center gap-3 rounded-2xl border-2 px-3 text-start transition active:scale-[0.98]"
                      style={{
                        borderColor: eaten ? '#10b981' : 'transparent',
                        background: eaten ? '#10b98114' : 'rgb(var(--canvas))',
                      }}
                    >
                      <CheckCircle checked={eaten} color="#10b981" />
                      <span className="flex-1">
                        <span className="block font-semibold">{fm.name}</span>
                        <span className="text-xs text-muted">{MEAL_TYPE_LABELS[fm.mealType]}</span>
                      </span>
                      <span className="text-end">
                        <span className="block font-bold tabular-nums">{fm.calories}</span>
                        <span className="text-xs text-muted">קל׳</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card>
          <CardTitle
            title="מה אכלתי"
            accent="emerald"
            icon={<Apple size={18} />}
            action={
              <IconButton label="הוסף ארוחה" onClick={() => setAddOpen(true)}>
                <Plus />
              </IconButton>
            }
          />
          {meals.length === 0 ? (
            <EmptyState emoji="🥑" title="עוד לא נרשם אוכל ליום הזה" text="סמן ארוחה קבועה או הוסף ארוחה חד-פעמית" />
          ) : (
            <div className="space-y-4">
              {MEAL_TYPE_ORDER.map((type) => {
                const list = meals.filter((m) => m.mealType === type);
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
                            <span className="flex-1 font-medium">
                              {m.name}
                              {m.fixedMealId != null && (
                                <span className="ms-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
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

        <WaterCard date={date} />
        <WeightCard date={date} />
      </div>

      <Fab accent="emerald" label="הוסף ארוחה" onClick={() => setAddOpen(true)} />
      <AddMealSheet open={addOpen} onClose={() => setAddOpen(false)} date={date} />
      <FixedMealsManager open={manageOpen} onClose={() => setManageOpen(false)} />
    </>
  );
}

function AddMealSheet({ open, onClose, date }: { open: boolean; onClose: () => void; date: string }) {
  const [name, setName] = useState('');
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
    }
  }, [open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || calories === '') return;
    const cal = Math.round(Number(calories) || 0);
    const prot = Math.round(Number(protein) || 0);
    let fixedMealId: number | undefined;
    if (saveAsFixed) {
      fixedMealId = await saveFixedMeal({ name: name.trim(), mealType, calories: cal, protein: prot, active: true });
    }
    await addMeal({ date, mealType, name: name.trim(), calories: cal, protein: prot, fixedMealId });
    onClose();
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="הוספת ארוחה">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label" htmlFor="meal-name">
            מה אכלת?
          </label>
          <input id="meal-name" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="לדוגמה: סלט עם טונה" />
        </div>
        <Segmented
          accent="emerald"
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
        <label className="flex cursor-pointer items-center gap-3 rounded-2xl bg-canvas p-3.5">
          <input type="checkbox" className="h-5 w-5 accent-emerald-600" checked={saveAsFixed} onChange={(e) => setSaveAsFixed(e.target.checked)} />
          <span className="font-medium">שמור גם כארוחה קבועה</span>
        </label>
        <Button accent="emerald" type="submit" className="w-full" disabled={!name.trim() || calories === ''}>
          הוספה
        </Button>
      </form>
    </BottomSheet>
  );
}

function WaterCard({ date }: { date: string }) {
  const glasses = useWater(date);
  const { waterGoal } = useSettings();
  return (
    <Card>
      <CardTitle title="מים" accent="sky" icon={<Droplets size={18} />} />
      <div className="flex items-center justify-between gap-3">
        <IconButton label="פחות כוס" onClick={() => setWater(date, glasses - 1)} className="bg-canvas">
          <Minus />
        </IconButton>
        <div className="flex flex-1 flex-wrap justify-center gap-1">
          {Array.from({ length: Math.max(waterGoal, glasses) }).map((_, i) => (
            <motion.span
              key={i}
              animate={{ scale: i < glasses ? 1 : 0.85, opacity: i < glasses ? 1 : 0.3 }}
              className="text-2xl"
            >
              💧
            </motion.span>
          ))}
        </div>
        <IconButton label="עוד כוס" onClick={() => setWater(date, glasses + 1)} className="bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300">
          <Plus />
        </IconButton>
      </div>
      <p className="mt-2 text-center text-sm font-semibold text-muted">
        {glasses} / {waterGoal} כוסות
      </p>
    </Card>
  );
}

function WeightCard({ date }: { date: string }) {
  const weights = useBodyWeights();
  const entry = weights.find((w) => w.date === date);
  const last = [...weights].reverse().find((w) => w.date < date);
  const [kg, setKg] = useState('');
  useEffect(() => setKg(entry ? String(entry.kg) : ''), [entry, date]);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const n = Number(kg);
    if (n > 0) setBodyWeight(date, Math.round(n * 10) / 10);
  };

  const diff = entry && last ? Math.round((entry.kg - last.kg) * 10) / 10 : null;

  return (
    <Card>
      <CardTitle title="משקל גוף" accent="violet" icon={<Scale size={18} />} />
      <form onSubmit={save} className="flex gap-2">
        <input
          className="input"
          type="number"
          step="0.1"
          inputMode="decimal"
          placeholder={last ? `אחרון: ${last.kg}` : 'ק״ג'}
          value={kg}
          onChange={(e) => setKg(e.target.value)}
          aria-label="משקל בק״ג"
        />
        <Button type="submit" disabled={!kg}>
          {entry ? 'עדכן' : 'שמור'}
        </Button>
      </form>
      {diff != null && (
        <p className={`mt-2 text-sm font-semibold ${diff <= 0 ? 'text-emerald-600' : 'text-orange-500'}`}>
          {diff === 0 ? 'ללא שינוי' : `${diff > 0 ? '+' : ''}${diff} ק״ג מהשקילה הקודמת`}
        </p>
      )}
    </Card>
  );
}
