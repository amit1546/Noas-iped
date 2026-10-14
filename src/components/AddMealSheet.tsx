import { useEffect, useState } from 'react';
import { addMeal, saveFixedMeal } from '../db/queries';
import { MEAL_TYPE_LABELS, MEAL_TYPE_ORDER, type MealType } from '../db/schema';
import { BottomSheet } from './BottomSheet';
import { Button, Segmented } from './ui';

function defaultMealType(time?: string): MealType {
  const h = time ? Number(time.slice(0, 2)) : new Date().getHours();
  if (h < 11) return 'breakfast';
  if (h < 16) return 'lunch';
  if (h < 21) return 'dinner';
  return 'snack';
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
  const [day, setDay] = useState(date);
  const [typeTouched, setTypeTouched] = useState(false);
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
      setDay(date);
      setTypeTouched(false);
    }
  }, [open, initialPlan, date]);

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
      date: plan ? day : date,
      mealType,
      name: name.trim(),
      calories: cal,
      protein: prot,
      fixedMealId,
      planned: plan || undefined,
      fromPlan: plan || undefined,
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
          <input id="meal-name" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="שם הארוחה" />
        </div>
        <Segmented
          accent="sky"
          value={mealType}
          onChange={(v) => {
            setMealType(v);
            setTypeTouched(true);
          }}
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
        {plan && (
          <div>
            <label className="label" htmlFor="meal-date">
              לאיזה יום?
            </label>
            <input
              id="meal-date"
              className="input"
              type="date"
              value={day}
              onChange={(e) => e.target.value && setDay(e.target.value)}
            />
          </div>
        )}
        <div>
          <label className="label" htmlFor="meal-time">
            שעה <span className="font-normal">(לא חובה)</span>
          </label>
          <input
            id="meal-time"
            className="input"
            type="time"
            value={time}
            onChange={(e) => {
              setTime(e.target.value);
              // Follow the chosen time unless the meal type was picked by hand.
              if (e.target.value && !typeTouched) setMealType(defaultMealType(e.target.value));
            }}
          />
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
