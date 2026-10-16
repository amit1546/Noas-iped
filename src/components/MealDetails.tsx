import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { ingredientLines } from '../lib/mealText';

/** "מרכיבים ▾" — opens the list of what's in a meal. Renders nothing if there is no detail. */
export function MealDetails({ details, className = '' }: { details?: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const lines = ingredientLines(details);
  if (!lines.length) return null;
  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex items-center gap-1 text-sm font-semibold text-muted hover:text-ink"
      >
        מרכיבים ({lines.length}) <ChevronDown size={15} className={`transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <ul className="mt-1.5 list-inside list-disc space-y-0.5 text-sm">
          {lines.map((l, i) => (
            <li key={i}>{l}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
