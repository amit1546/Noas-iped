import { Apple, Check, ChevronLeft, Flame, ListChecks, Pencil, Settings, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalorieSummary } from '../components/CalorieSummary';
import { DateNav } from '../components/DateNav';
import { HabitChecklist } from '../components/HabitChecklist';
import { HabitForm } from '../components/HabitForm';
import { TaskList } from '../components/TaskList';
import { Card, CardTitle } from '../components/ui';
import { useMeals } from '../db/queries';
import type { Habit } from '../db/schema';
import { greeting } from '../lib/dates';
import { quoteOfDay } from '../lib/quotes';
import { useSelectedDate } from '../lib/selectedDate';
import { sumMeals } from '../lib/stats';

export function Today() {
  const [date, setDate] = useSelectedDate();
  const meals = useMeals(date);
  const [editingHabits, setEditingHabits] = useState(false);
  const [habitForm, setHabitForm] = useState<{ open: boolean; habit?: Habit }>({ open: false });

  return (
    <>
      <header className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">{greeting()} 👋</h1>
          <p className="mt-1 flex items-center gap-1.5 text-muted">
            <Sparkles size={16} className="shrink-0 text-amber-500" />
            {quoteOfDay(date)}
          </p>
        </div>
        <Link
          to="/settings"
          aria-label="הגדרות"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-muted hover:bg-line/60 md:hidden"
        >
          <Settings size={22} />
        </Link>
      </header>

      <DateNav date={date} onChange={setDate} />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardTitle title="משימות" icon={<ListChecks size={18} />} />
          <TaskList date={date} />
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
          />
        </Card>

        <Card className="lg:col-span-2">
          <CardTitle
            title="תזונה"
            accent="sky"
            icon={<Apple size={18} />}
            action={
              <Link to="/nutrition" className="flex items-center text-sm font-semibold text-muted hover:text-ink">
                לארוחות <ChevronLeft size={16} />
              </Link>
            }
          />
          <CalorieSummary totals={sumMeals(meals)} />
        </Card>
      </div>

      <HabitForm open={habitForm.open} habit={habitForm.habit} onClose={() => setHabitForm({ open: false })} />
    </>
  );
}
