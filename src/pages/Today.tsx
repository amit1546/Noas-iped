import { Apple, ChevronLeft, Dumbbell, Flame, ListChecks, Settings, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalorieSummary } from '../components/CalorieSummary';
import { DateNav } from '../components/DateNav';
import { HabitChecklist } from '../components/HabitChecklist';
import { HabitForm } from '../components/HabitForm';
import { TaskList } from '../components/TaskList';
import { Card, CardTitle } from '../components/ui';
import { useMeals, useWorkoutsOn } from '../db/queries';
import { WORKOUT_TYPE_LABELS } from '../db/schema';
import { greeting } from '../lib/dates';
import { quoteOfDay } from '../lib/quotes';
import { useSelectedDate } from '../lib/selectedDate';
import { sumMeals } from '../lib/stats';

function SeeAll({ to }: { to: string }) {
  return (
    <Link to={to} className="flex items-center text-sm font-semibold text-muted hover:text-ink">
      הכול <ChevronLeft size={16} />
    </Link>
  );
}

export function Today() {
  const [date, setDate] = useSelectedDate();
  const meals = useMeals(date);
  const workouts = useWorkoutsOn(date);
  const [habitFormOpen, setHabitFormOpen] = useState(false);

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
          <CardTitle title="הרגלים" icon={<Flame size={18} />} action={<SeeAll to="/habits" />} />
          <HabitChecklist date={date} onAdd={() => setHabitFormOpen(true)} />
        </Card>

        <Card>
          <CardTitle title="משימות" icon={<ListChecks size={18} />} action={<SeeAll to="/habits" />} />
          <TaskList date={date} />
        </Card>

        <Card>
          <CardTitle title="תזונה" accent="emerald" icon={<Apple size={18} />} action={<SeeAll to="/nutrition" />} />
          <CalorieSummary totals={sumMeals(meals)} />
        </Card>

        <Card>
          <CardTitle title="אימון" accent="orange" icon={<Dumbbell size={18} />} action={<SeeAll to="/workouts" />} />
          {workouts.length ? (
            <ul className="space-y-2">
              {workouts.map((w) => (
                <li key={w.id} className="flex items-center gap-3 rounded-2xl bg-orange-50 p-3 dark:bg-orange-500/10">
                  <span className="text-2xl">✅</span>
                  <div>
                    <p className="font-bold">{w.title || WORKOUT_TYPE_LABELS[w.type]}</p>
                    <p className="text-sm text-muted">
                      {w.durationMin ? `${w.durationMin} דק׳ · ` : ''}
                      {w.exercises.length} תרגילים
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <Link
              to="/workouts"
              className="flex min-h-[72px] items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line font-semibold text-muted transition hover:border-orange-400 hover:text-orange-500"
            >
              <Dumbbell size={20} /> עוד לא התאמנת היום — יאללה!
            </Link>
          )}
        </Card>
      </div>

      <HabitForm open={habitFormOpen} onClose={() => setHabitFormOpen(false)} />
    </>
  );
}
