import { Apple, Check, ChevronLeft, Flame, ListChecks, Pencil, Scale, Settings, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalorieSummary } from '../components/CalorieSummary';
import { DateNav } from '../components/DateNav';
import { HabitChecklist } from '../components/HabitChecklist';
import { HabitForm } from '../components/HabitForm';
import { TaskList } from '../components/TaskList';
import { Card, CardTitle } from '../components/ui';
import { useBodyWeights, useMeals } from '../db/queries';
import type { Habit } from '../db/schema';
import { formatShort, greeting, todayISO } from '../lib/dates';
import { daysSince } from '../lib/reminder';
import { quoteOfDay } from '../lib/quotes';
import { useSelectedDate } from '../lib/selectedDate';
import { sumMeals } from '../lib/stats';

export function Today() {
  const [date, setDate] = useSelectedDate();
  const meals = useMeals(date);
  const [editingHabits, setEditingHabits] = useState(false);
  const [habitForm, setHabitForm] = useState<{ open: boolean; habit?: Habit; name?: string }>({ open: false });
  const weights = useBodyWeights();
  const lastWeigh = weights[weights.length - 1];
  const weighDue = !lastWeigh || daysSince(lastWeigh.date, todayISO()) >= 7;

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

      {weighDue && (
        <Link
          to="/nutrition"
          className="mb-5 flex items-center gap-3 rounded-3xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"
        >
          <Scale size={20} className="shrink-0" />
          <span className="flex-1 text-sm font-semibold">
            {lastWeigh ? `עבר שבוע מהשקילה האחרונה (${formatShort(lastWeigh.date)}) — זמן להישקל` : 'עוד לא נשקלת — כדאי להתחיל לעקוב'}
          </span>
          <ChevronLeft size={18} />
        </Link>
      )}

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
            onAdd={(name) => setHabitForm({ open: true, name })}
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
          <CalorieSummary
            totals={sumMeals(meals)}
            planned={meals.filter((m) => m.planned).reduce((a, m) => a + m.calories, 0)}
          />
        </Card>
      </div>

      <HabitForm
        open={habitForm.open}
        habit={habitForm.habit}
        initialName={habitForm.name}
        onClose={() => setHabitForm({ open: false })}
      />
    </>
  );
}
