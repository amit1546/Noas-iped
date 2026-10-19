import { CalendarClock, CalendarRange, Check, Flame, ListChecks, Pencil, Plus, Settings2 } from 'lucide-react';
import { useState } from 'react';
import { AddMealSheet } from '../components/AddMealSheet';
import { DateNav } from '../components/DateNav';
import { DayPlanList } from '../components/DayPlanList';
import { FixedMealsManager } from '../components/FixedMealsManager';
import { HabitChecklist } from '../components/HabitChecklist';
import { HabitForm } from '../components/HabitForm';
import { MealIdeas } from '../components/MealIdeas';
import { PlannedMeals } from '../components/PlannedMeals';
import { Card, CardTitle, PageHeader } from '../components/ui';
import { useFixedMeals, useMeals, useSettings } from '../db/queries';
import type { Habit } from '../db/schema';
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

  const plannedCalories = meals.filter((m) => m.planned).reduce((a, m) => a + m.calories, 0);
  const dayCalories = sumMeals(meals).calories + plannedCalories;

  return (
    <>
      <PageHeader title="תכנון" accent="blue" icon={<CalendarRange />} />
      <DateNav date={date} onChange={setDate} />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardTitle title="היום שלי" icon={<ListChecks size={18} />} />
          <DayPlanList date={date} />
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
          <PlannedMeals meals={meals} hint={false} />
          <p className="mb-2 mt-5 text-sm font-bold text-muted">מה לאכול? רעיונות לפי זמן</p>
          <MealIdeas meals={fixedMeals} date={date} onManage={() => setManageMeals(true)} />
          {dayCalories > 0 && (
            <p className={`mt-3 text-sm font-medium ${dayCalories >= calorieGoal ? 'text-emerald-600' : 'text-muted'}`}>
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
