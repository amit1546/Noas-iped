import { Bell, CalendarClock, CalendarRange, Check, ChevronDown, Dumbbell, Flame, ListChecks, Pencil, Plus, Settings2, X } from 'lucide-react';
import { useState } from 'react';
import { AddMealSheet } from '../components/AddMealSheet';
import { DateNav } from '../components/DateNav';
import { FixedMealsManager } from '../components/FixedMealsManager';
import { HabitChecklist } from '../components/HabitChecklist';
import { HabitForm } from '../components/HabitForm';
import { PlannedMeals } from '../components/PlannedMeals';
import { ReminderList } from '../components/ReminderList';
import { TaskList } from '../components/TaskList';
import { WorkoutList } from '../components/WorkoutList';
import { Card, CardTitle, PageHeader } from '../components/ui';
import { planFixedMeal, useFixedMeals, useMeals, useSettings } from '../db/queries';
import { fixedMealTypes, MEAL_TYPE_LABELS, type FixedMeal, type Habit } from '../db/schema';
import { useSelectedDate } from '../lib/selectedDate';
import { sumMeals } from '../lib/stats';


export function Plan() {
  const [date, setDate] = useSelectedDate();
  const meals = useMeals(date);
  const fixedMeals = useFixedMeals().filter((m) => m.active);
  const { calorieGoal } = useSettings();
  const [editingHabits, setEditingHabits] = useState(false);
  const [habitForm, setHabitForm] = useState<{ open: boolean; habit?: Habit; name?: string }>({ open: false });
  const [planningMeal, setPlanningMeal] = useState(false);
  const [manageMeals, setManageMeals] = useState(false);
  const [picking, setPicking] = useState<FixedMeal | null>(null);

  const plannedCalories = meals.filter((m) => m.planned).reduce((a, m) => a + m.calories, 0);
  const dayCalories = sumMeals(meals).calories + plannedCalories;

  return (
    <>
      <PageHeader title="תכנון" subtitle="מתכננים כאן — מסמנים ✓ במסך היום" accent="blue" icon={<CalendarRange />} />
      <DateNav date={date} onChange={setDate} />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardTitle title="משימות" icon={<ListChecks size={18} />} />
          <TaskList date={date} />
        </Card>

        <Card>
          <CardTitle title="אימונים" icon={<Dumbbell size={18} />} />
          <WorkoutList date={date} />
        </Card>

        <Card>
          <CardTitle title="תזכורות" accent="blue" icon={<Bell size={18} />} />
          <ReminderList date={date} />
        </Card>

        <Card>
          <CardTitle
            title="ארוחות"
            accent="sky"
            icon={<CalendarClock size={18} />}
            action={
              <div className="flex gap-1.5">
                <button className="chip text-muted hover:text-ink" onClick={() => setManageMeals(true)} aria-label="ניהול ארוחות קבועות">
                  <Settings2 size={16} />
                </button>
                <button className="chip text-muted hover:text-ink" onClick={() => setPlanningMeal(true)}>
                  <Plus size={16} /> ארוחה אחרת
                </button>
              </div>
            }
          />
          {fixedMeals.length === 0 && (
            <button
              onClick={() => setManageMeals(true)}
              className="mb-3 w-full rounded-2xl border-2 border-dashed border-line py-3 text-sm font-semibold text-muted hover:text-ink"
            >
              + הגדרת ארוחות קבועות לתכנון מהיר
            </button>
          )}
          {fixedMeals.length > 0 && (
            <div className="mb-3">
              <p className="mb-1.5 text-xs font-medium text-muted">הוספה מהירה מהארוחות הקבועות:</p>
              <div className="flex flex-wrap gap-1.5">
                {fixedMeals.map((fm) => {
                  const types = fixedMealTypes(fm);
                  const several = types.length > 1;
                  return (
                    <button
                      key={fm.id}
                      onClick={() => (several ? setPicking(picking?.id === fm.id ? null : fm) : planFixedMeal(fm, date))}
                      className={`chip text-ink hover:border-sky-400 ${picking?.id === fm.id ? 'border-sky-500 bg-sky-50 dark:bg-sky-500/10' : ''}`}
                      aria-label={`תכנן ${fm.name}`}
                      aria-expanded={several ? picking?.id === fm.id : undefined}
                    >
                      <Plus size={14} className="text-sky-600" /> {fm.name}
                      {several && <ChevronDown size={14} className="text-muted" />}
                      {fm.calories > 0 && <span className="text-xs text-muted">{fm.calories}</span>}
                    </button>
                  );
                })}
              </div>
              {picking && (
                <div className="mt-2 flex flex-wrap items-center gap-2 rounded-2xl bg-sky-50 p-3 dark:bg-sky-500/10">
                  <span className="font-semibold">{picking.name} — לאיזה זמן?</span>
                  {fixedMealTypes(picking).map((t) => (
                    <button
                      key={t}
                      aria-label={`${picking.name} ל${MEAL_TYPE_LABELS[t]}`}
                      onClick={() => {
                        planFixedMeal(picking, date, undefined, t);
                        setPicking(null);
                      }}
                      className="chip border-sky-300 bg-surface font-semibold text-sky-700 dark:text-sky-300"
                    >
                      {MEAL_TYPE_LABELS[t]}
                    </button>
                  ))}
                  <button aria-label="ביטול" onClick={() => setPicking(null)} className="ms-auto p-1 text-muted hover:text-ink">
                    <X size={18} />
                  </button>
                </div>
              )}
            </div>
          )}
          <PlannedMeals meals={meals} hint={false} />
          {dayCalories > 0 && (
            <p className={`mt-3 text-sm font-medium ${dayCalories > calorieGoal ? 'text-red-500' : 'text-muted'}`}>
              סה״כ ליום: {dayCalories.toLocaleString('he-IL')} מתוך {calorieGoal.toLocaleString('he-IL')} קל׳
            </p>
          )}
        </Card>

        <Card>
          <CardTitle
            title="הרגלים"
            icon={<Flame size={18} />}
            action={
              <button
                className={`chip ${editingHabits ? 'border-transparent bg-blue-600 text-white' : 'text-muted hover:text-ink'}`}
                onClick={() => setEditingHabits((e) => !e)}
              >
                {editingHabits ? (
                  <>
                    <Check size={16} /> סיום
                  </>
                ) : (
                  <>
                    <Pencil size={14} /> עריכה
                  </>
                )}
              </button>
            }
          />
          <HabitChecklist
            date={date}
            editing={editingHabits}
            onEdit={(habit) => setHabitForm({ open: true, habit })}
            onAdd={(name) => setHabitForm({ open: true, name })}
          />
        </Card>
      </div>

      <FixedMealsManager open={manageMeals} onClose={() => setManageMeals(false)} />
      <AddMealSheet open={planningMeal} plan onClose={() => setPlanningMeal(false)} date={date} />
      <HabitForm
        open={habitForm.open}
        habit={habitForm.habit}
        initialName={habitForm.name}
        onClose={() => setHabitForm({ open: false })}
      />
    </>
  );
}
