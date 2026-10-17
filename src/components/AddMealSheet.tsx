import { useEffect, useState } from 'react';
import { addMeal, saveFixedMeal, useRecentMeals } from '../db/queries';
import { MEAL_TYPE_LABELS, MEAL_TYPE_ORDER, type MealType, type MealUnit } from '../db/schema';
import { amountSuffix, scaleNutrition } from '../lib/amount';
import { mealTypeForTime } from '../lib/mealText';
import { BottomSheet } from './BottomSheet';
import { OptionalTime } from './OptionalTime';
import { Button, Segmented } from './ui';

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
  const recent = useRecentMeals();
  const [name, setName] = useState('');
  const [plan, setPlan] = useState(initialPlan);
  const [time, setTime] = useState('');
  const [day, setDay] = useState(date);
  const [typeTouched, setTypeTouched] = useState(false);
  const [mealType, setMealType] = useState<MealType>(mealTypeForTime);
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [unit, setUnit] = useState<MealUnit>('serving');
  const [amount, setAmount] = useState('100');
  const [saveAsFixed, setSaveAsFixed] = useState(false);
  const [extraTypes, setExtraTypes] = useState<MealType[]>([]);
  const [details, setDetails] = useState('');
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (open) {
      setName('');
      setCalories('');
      setProtein('');
      setUnit('serving');
      setAmount('100');
      setSaveAsFixed(false);
      setExtraTypes([]);
      setDetails('');
      setShowDetails(false);
      setMealType(mealTypeForTime());
      setPlan(initialPlan);
      setTime('');
      setDay(date);
      setTypeTouched(false);
    }
  }, [open, initialPlan, date]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    // The numbers typed are per serving or per 100 g; the meal keeps the total for the amount.
    const perCal = Number(calories) || 0;
    const perProt = Number(protein) || 0;
    const qty = unit === 'per100' ? Number(amount) || 100 : 1;
    const { calories: cal, protein: prot } = scaleNutrition({ calories: perCal, protein: perProt }, unit, qty);
    let fixedMealId: number | undefined;
    if (saveAsFixed) {
      const types = MEAL_TYPE_ORDER.filter((t) => t === mealType || extraTypes.includes(t));
      fixedMealId = await saveFixedMeal({ name: name.trim(), mealType, mealTypes: types, calories: Math.round(perCal), protein: Math.round(perProt), active: true, details: details.trim() || undefined, unit });
    }
    await addMeal({
      date: plan ? day : date,
      mealType,
      name: name.trim(),
      calories: cal,
      protein: prot,
      unit,
      amount: qty,
      perCalories: Math.round(perCal),
      perProtein: Math.round(perProt),
      fixedMealId,
      details: details.trim() || undefined,
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
        {!name && recent.length > 0 && (
          <div className="flex flex-wrap gap-2" role="group" aria-label="ארוחות אחרונות">
            {recent.map((m) => (
              <button
                type="button"
                key={m.id}
                className="chip text-muted hover:text-ink"
                onClick={() => {
                  setName(m.name);
                  setMealType(m.mealType);
                  setTypeTouched(true);
                  setUnit(m.unit ?? 'serving');
                  setAmount(String(m.unit === 'per100' ? m.amount ?? 100 : 100));
                  setCalories(m.perCalories ?? m.calories ? String(m.perCalories ?? m.calories) : '');
                  setProtein(m.perProtein ?? m.protein ? String(m.perProtein ?? m.protein) : '');
                  setDetails(m.details ?? '');
                  setShowDetails(Boolean(m.details));
                }}
              >
                {m.name}
              </button>
            ))}
          </div>
        )}
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
        <Segmented<MealUnit>
          accent="sky"
          value={unit}
          onChange={setUnit}
          options={[
            { value: 'serving', label: 'ערכים למנה' },
            { value: 'per100', label: `ערכים ל־100 ${amountSuffix('per100', mealType === 'drink')}` },
          ]}
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
        {unit === 'per100' && (
          <div>
            <label className="label" htmlFor="meal-amount">
              כמות ({amountSuffix('per100', mealType === 'drink')})
            </label>
            <input id="meal-amount" className="input" type="number" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
        )}
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
        {showDetails ? (
          <div>
            <label className="label" htmlFor="meal-details">
              פירוט — מרכיבים, כל אחד בשורה
            </label>
            <textarea id="meal-details" className="input min-h-[96px]" value={details} onChange={(e) => setDetails(e.target.value)} />
          </div>
        ) : (
          <button type="button" onClick={() => setShowDetails(true)} className="chip text-muted hover:text-ink">
            + פירוט ומרכיבים
          </button>
        )}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted">שעה:</span>
          <OptionalTime
            value={time}
            label="שעה לארוחה"
            onChange={(v) => {
              setTime(v);
              // Follow the chosen time unless the meal type was picked by hand.
              if (v && !typeTouched) setMealType(mealTypeForTime(v));
            }}
          />
        </div>
        <label className="flex cursor-pointer items-center gap-3 rounded-2xl bg-canvas p-3.5">
          <input type="checkbox" className="h-5 w-5 accent-sky-600" checked={saveAsFixed} onChange={(e) => setSaveAsFixed(e.target.checked)} />
          <span className="font-medium">שמור גם כארוחה קבועה</span>
        </label>
        {saveAsFixed && (
          <div>
            <p className="mb-1.5 text-sm font-medium text-muted">מתאימה גם ל: (אפשר לבחור כמה)</p>
            <div className="flex flex-wrap gap-2">
              {MEAL_TYPE_ORDER.filter((t) => t !== mealType).map((t) => {
                const on = extraTypes.includes(t);
                return (
                  <button
                    type="button"
                    key={t}
                    aria-pressed={on}
                    onClick={() => setExtraTypes(on ? extraTypes.filter((x) => x !== t) : [...extraTypes, t])}
                    className={`chip ${on ? 'border-transparent bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300' : 'text-muted hover:text-ink'}`}
                  >
                    {on && '✓ '}
                    {MEAL_TYPE_LABELS[t]}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        <Button accent="sky" type="submit" className="w-full" disabled={!name.trim()}>
          {plan ? 'הוסף לתכנון' : 'הוספה'}
        </Button>
      </form>
    </BottomSheet>
  );
}
