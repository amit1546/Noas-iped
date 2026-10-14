import { Clock, Copy, Dumbbell, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { BottomSheet } from '../components/BottomSheet';
import { useCelebrate } from '../components/Confetti';
import { Fab } from '../components/Fab';
import { Button, Card, EmptyState, IconButton, PageHeader, Segmented, Stat } from '../components/ui';
import { deleteWorkout, saveWorkout, useSettings, useWorkouts } from '../db/queries';
import { WORKOUT_TYPE_LABELS, type Exercise, type Workout, type WorkoutType } from '../db/schema';
import { formatLong, todayISO, weekStartISO } from '../lib/dates';
import { useSelectedDate } from '../lib/selectedDate';
import { workoutVolume } from '../lib/stats';

const TYPE_EMOJI: Record<WorkoutType, string> = { strength: '🏋️', cardio: '🏃', other: '🤸' };

export function Workouts() {
  const workouts = useWorkouts();
  const { weeklyWorkoutGoal } = useSettings();
  const [selectedDate] = useSelectedDate();
  const [sheet, setSheet] = useState<{ open: boolean; workout?: Workout }>({ open: false });

  const weekStart = weekStartISO(todayISO());
  const thisWeek = workouts.filter((w) => w.date >= weekStart);
  const minutesThisWeek = thisWeek.reduce((a, w) => a + (w.durationMin || 0), 0);

  const openNew = () => setSheet({ open: true });
  const duplicate = (w: Workout) =>
    setSheet({ open: true, workout: { ...w, id: undefined, date: selectedDate, notes: '' } });

  return (
    <>
      <PageHeader title="אימונים" subtitle="כל אימון נחשב" accent="orange" icon={<Dumbbell />} />

      <div className="mb-6 grid grid-cols-3 gap-3">
        <Stat label="השבוע" value={`${thisWeek.length}/${weeklyWorkoutGoal}`} sub="אימונים" />
        <Stat label="דקות השבוע" value={minutesThisWeek} />
        <Stat label="סה״כ" value={workouts.length} sub="אימונים" />
      </div>

      {workouts.length === 0 ? (
        <Card>
          <EmptyState
            emoji="💪"
            title="עוד לא נרשמו אימונים"
            text="תעד את האימון הראשון שלך — תרגילים, סטים ומשקלים"
            action={
              <Button accent="orange" onClick={openNew}>
                הוסף אימון
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {workouts.map((w) => (
            <Card key={w.id}>
              <div className="flex items-start gap-3">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-orange-100 text-2xl dark:bg-orange-500/15">
                  {TYPE_EMOJI[w.type]}
                </span>
                <div className="flex-1">
                  <p className="font-bold">{w.title || WORKOUT_TYPE_LABELS[w.type]}</p>
                  <p className="text-sm text-muted">{formatLong(w.date)}</p>
                  <div className="mt-1 flex flex-wrap gap-3 text-xs font-medium text-muted">
                    {w.durationMin > 0 && (
                      <span className="flex items-center gap-1">
                        <Clock size={13} /> {w.durationMin} דק׳
                      </span>
                    )}
                    {w.exercises.length > 0 && <span>{w.exercises.length} תרגילים</span>}
                    {workoutVolume(w) > 0 && <span>נפח {workoutVolume(w).toLocaleString('he-IL')} ק״ג</span>}
                  </div>
                </div>
                <div className="flex">
                  <IconButton label="שכפל אימון" onClick={() => duplicate(w)}>
                    <Copy size={18} />
                  </IconButton>
                  <IconButton label="עריכה" onClick={() => setSheet({ open: true, workout: w })}>
                    <Pencil size={18} />
                  </IconButton>
                  <IconButton label="מחיקה" onClick={() => confirm('למחוק את האימון?') && deleteWorkout(w.id!)}>
                    <Trash2 size={18} />
                  </IconButton>
                </div>
              </div>
              {w.exercises.length > 0 && (
                <ul className="mt-3 space-y-1 border-t border-line pt-3 text-sm">
                  {w.exercises.map((ex, i) => (
                    <li key={i} className="flex justify-between gap-2">
                      <span className="font-medium">{ex.name}</span>
                      <span className="text-muted tabular-nums" dir="ltr">
                        {ex.sets.map((s) => (s.weight ? `${s.reps}×${s.weight}` : `${s.reps}`)).join(' · ')}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              {w.notes && <p className="mt-2 text-sm text-muted">{w.notes}</p>}
            </Card>
          ))}
        </div>
      )}

      <Fab accent="orange" label="אימון חדש" onClick={openNew} />
      <WorkoutForm
        open={sheet.open}
        workout={sheet.workout}
        defaultDate={selectedDate}
        onClose={() => setSheet({ open: false })}
      />
    </>
  );
}

function blankWorkout(date: string): Workout {
  return { date, type: 'strength', title: '', durationMin: 0, notes: '', exercises: [] };
}

function WorkoutForm({
  open,
  onClose,
  workout,
  defaultDate,
}: {
  open: boolean;
  onClose: () => void;
  workout?: Workout;
  defaultDate: string;
}) {
  const [w, setW] = useState<Workout>(blankWorkout(defaultDate));
  const celebrate = useCelebrate();
  const { weeklyWorkoutGoal } = useSettings();
  const workouts = useWorkouts();

  useEffect(() => {
    if (open) setW(workout ? structuredClone(workout) : blankWorkout(defaultDate));
  }, [open, workout, defaultDate]);

  const setEx = (i: number, ex: Exercise) => setW((cur) => ({ ...cur, exercises: cur.exercises.map((e, j) => (j === i ? ex : e)) }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean: Workout = {
      ...w,
      title: w.title.trim(),
      exercises: w.exercises
        .filter((ex) => ex.name.trim())
        .map((ex) => ({ ...ex, name: ex.name.trim(), sets: ex.sets.filter((s) => s.reps > 0) })),
    };
    const isNew = clean.id == null;
    await saveWorkout(clean);
    onClose();
    if (isNew) {
      const weekStart = weekStartISO(todayISO());
      const count = workouts.filter((x) => x.date >= weekStart).length + (clean.date >= weekStart ? 1 : 0);
      celebrate(count === weeklyWorkoutGoal ? 'הגעת ליעד האימונים השבועי! 🏆' : 'אימון נרשם — כל הכבוד! 💪');
    }
  };

  return (
    <BottomSheet open={open} onClose={onClose} title={w.id ? 'עריכת אימון' : 'אימון חדש'}>
      <form onSubmit={save} className="space-y-4">
        <Segmented
          accent="orange"
          value={w.type}
          onChange={(type) => setW({ ...w, type })}
          options={(Object.keys(WORKOUT_TYPE_LABELS) as WorkoutType[]).map((t) => ({
            value: t,
            label: `${TYPE_EMOJI[t]} ${WORKOUT_TYPE_LABELS[t]}`,
          }))}
        />
        <div>
          <label className="label" htmlFor="w-title">
            שם האימון
          </label>
          <input id="w-title" className="input" placeholder="לדוגמה: רגליים / ריצה 5 ק״מ" value={w.title} onChange={(e) => setW({ ...w, title: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="w-date">
              תאריך
            </label>
            <input id="w-date" className="input" type="date" value={w.date} onChange={(e) => e.target.value && setW({ ...w, date: e.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="w-dur">
              משך (דקות)
            </label>
            <input
              id="w-dur"
              className="input"
              type="number"
              inputMode="numeric"
              value={w.durationMin || ''}
              onChange={(e) => setW({ ...w, durationMin: Number(e.target.value) || 0 })}
            />
          </div>
        </div>

        <div>
          <span className="label">תרגילים</span>
          <div className="space-y-3">
            {w.exercises.map((ex, i) => (
              <div key={i} className="rounded-2xl bg-canvas p-3">
                <div className="mb-2 flex gap-2">
                  <input
                    className="input bg-surface"
                    placeholder="שם התרגיל"
                    value={ex.name}
                    onChange={(e) => setEx(i, { ...ex, name: e.target.value })}
                    aria-label="שם התרגיל"
                  />
                  <IconButton label="הסר תרגיל" onClick={() => setW({ ...w, exercises: w.exercises.filter((_, j) => j !== i) })}>
                    <Trash2 size={18} />
                  </IconButton>
                </div>
                <div className="space-y-1.5">
                  {ex.sets.map((s, si) => (
                    <div key={si} className="flex items-center gap-2 text-sm">
                      <span className="w-12 font-semibold text-muted">סט {si + 1}</span>
                      <input
                        className="w-full rounded-xl border border-line bg-surface px-3 py-2"
                        type="number"
                        inputMode="numeric"
                        placeholder="חזרות"
                        value={s.reps || ''}
                        onChange={(e) =>
                          setEx(i, { ...ex, sets: ex.sets.map((x, k) => (k === si ? { ...x, reps: Number(e.target.value) || 0 } : x)) })
                        }
                        aria-label="חזרות"
                      />
                      <span className="text-muted">×</span>
                      <input
                        className="w-full rounded-xl border border-line bg-surface px-3 py-2"
                        type="number"
                        inputMode="decimal"
                        placeholder="ק״ג"
                        value={s.weight || ''}
                        onChange={(e) =>
                          setEx(i, { ...ex, sets: ex.sets.map((x, k) => (k === si ? { ...x, weight: Number(e.target.value) || 0 } : x)) })
                        }
                        aria-label="משקל"
                      />
                      <button
                        type="button"
                        aria-label="הסר סט"
                        className="p-1 text-muted"
                        onClick={() => setEx(i, { ...ex, sets: ex.sets.filter((_, k) => k !== si) })}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  className="mt-2 text-sm font-semibold text-orange-600 dark:text-orange-400"
                  onClick={() => setEx(i, { ...ex, sets: [...ex.sets, ex.sets[ex.sets.length - 1] ?? { reps: 0, weight: 0 }] })}
                >
                  + סט
                </button>
              </div>
            ))}
            <button
              type="button"
              className="btn-ghost w-full border-2 border-dashed border-line"
              onClick={() => setW({ ...w, exercises: [...w.exercises, { name: '', sets: [{ reps: 0, weight: 0 }] }] })}
            >
              <Plus size={18} /> הוסף תרגיל
            </button>
          </div>
        </div>

        <div>
          <label className="label" htmlFor="w-notes">
            הערות
          </label>
          <textarea id="w-notes" className="input min-h-[80px]" value={w.notes} onChange={(e) => setW({ ...w, notes: e.target.value })} placeholder="איך הרגשת?" />
        </div>
        <Button accent="orange" type="submit" className="w-full">
          {w.id ? 'שמירה' : 'שמירת אימון'}
        </Button>
      </form>
    </BottomSheet>
  );
}
