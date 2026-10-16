import { CalendarPlus } from 'lucide-react';
import { useState } from 'react';
import { eventsICS, googleCalendarUrl, KIND_EMOJI, type CalEvent } from '../lib/calendarExport';
import { describeDays } from '../lib/habitText';
import { isStandaloneApp, sendICS, shareICS } from '../lib/reminder';
import { BottomSheet } from './BottomSheet';
import { Button, IconButton, Segmented } from './ui';

type Item = Omit<CalEvent, 'time'> & { time?: string };

/** A small calendar button on a single item: pick a time (if it has none) and an alert, and send it to the phone's calendar. */
export function ItemCalendarButton({ item }: { item: Item }) {
  const [open, setOpen] = useState(false);
  const [time, setTime] = useState('');
  const [lead, setLead] = useState<0 | 10 | 30>(0);

  const show = () => {
    setTime(item.time ?? '09:00');
    setOpen(true);
  };
  const send = async () => {
    await sendICS(eventsICS([{ ...item, time: time || '09:00' }], lead), 'noas-journal.ics');
    setOpen(false);
  };

  return (
    <>
      <IconButton label={`הוסף את "${item.title}" ליומן הטלפון`} onClick={show}>
        <CalendarPlus size={18} />
      </IconButton>
      <BottomSheet open={open} onClose={() => setOpen(false)} title="הוספה ליומן הטלפון">
        <div className="space-y-4">
          <p className="font-semibold">
            {KIND_EMOJI[item.kind]} {item.title}
            {item.repeat && (
              <span className="mt-0.5 block text-sm font-normal text-muted">
                {item.repeat === 'daily' ? 'כל יום' : `כל שבוע: ${describeDays({ days: item.repeat })}`}
              </span>
            )}
          </p>
          <label className="flex items-center justify-between gap-3 rounded-2xl bg-canvas p-3">
            <span className="font-medium">שעה</span>
            <input type="time" className="input w-auto" value={time} onChange={(e) => setTime(e.target.value)} aria-label="שעה ביומן" />
          </label>
          {isStandaloneApp() ? (
            <>
              <a
                className="btn w-full bg-blue-600 text-white"
                href={googleCalendarUrl({ ...item, time: time || '09:00' })}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
              >
                <CalendarPlus size={18} /> הוסף ל־Google Calendar
              </a>
              <p className="text-center text-xs text-muted">נפתח בגוגל, לוחצים שם "שמירה". ההתראה לפי ברירת המחדל של היומן.</p>
              <button
                type="button"
                className="w-full py-1 text-center text-sm text-muted underline"
                onClick={() => shareICS(eventsICS([{ ...item, time: time || '09:00' }], lead), 'noas-journal.ics')}
              >
                שמירה כקובץ
              </button>
            </>
          ) : (
            <>
              <Segmented
                value={String(lead)}
                onChange={(v) => setLead(Number(v) as 0 | 10 | 30)}
                options={[
                  { value: '0', label: 'בזמן' },
                  { value: '10', label: '10 דק׳ לפני' },
                  { value: '30', label: '30 דק׳ לפני' },
                ]}
              />
              <Button className="w-full" onClick={send} disabled={!time}>
                <CalendarPlus size={18} /> הוסף ליומן
              </Button>
            </>
          )}
        </div>
      </BottomSheet>
    </>
  );
}
