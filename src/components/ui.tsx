import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ACCENT, type Accent } from '../lib/accent';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`card p-5 ${className}`}>{children}</section>;
}

export function CardTitle({
  icon,
  title,
  accent = 'violet',
  action,
}: {
  icon?: ReactNode;
  title: string;
  accent?: Accent;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        {icon && (
          <span className={`grid h-9 w-9 place-items-center rounded-xl ${ACCENT[accent].soft}`}>{icon}</span>
        )}
        <h2 className="text-lg font-bold">{title}</h2>
      </div>
      {action}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  accent,
  icon,
  action,
}: {
  title: string;
  subtitle?: ReactNode;
  accent: Accent;
  icon: ReactNode;
  action?: ReactNode;
}) {
  return (
    <header className="mb-6 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <span
          className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-soft ${ACCENT[accent].gradient}`}
        >
          {icon}
        </span>
        <div>
          <h1 className="text-2xl font-extrabold leading-tight">{title}</h1>
          {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
        </div>
      </div>
      {action}
    </header>
  );
}

export function Button({
  children,
  accent = 'violet',
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { accent?: Accent }) {
  return (
    <button className={`btn ${ACCENT[accent].bg} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function IconButton({
  children,
  label,
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      aria-label={label}
      title={label}
      className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl text-muted transition hover:bg-line/60 hover:text-ink active:scale-90 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function EmptyState({
  emoji,
  title,
  text,
  action,
}: {
  emoji: string;
  title: string;
  text?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-4 py-8 text-center">
      <motion.div
        initial={{ scale: 0.6, rotate: -10, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 14 }}
        className="mb-3 grid h-16 w-16 place-items-center rounded-3xl bg-canvas text-3xl"
      >
        {emoji}
      </motion.div>
      <p className="font-semibold">{title}</p>
      {text && <p className="mt-1 max-w-xs text-sm text-muted">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function CheckCircle({ checked, color }: { checked: boolean; color: string }) {
  return (
    <motion.span
      animate={{ scale: checked ? [1, 1.25, 1] : 1 }}
      transition={{ duration: 0.3 }}
      className="grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 transition-colors"
      style={{ borderColor: color, background: checked ? color : 'transparent' }}
    >
      {checked && (
        <motion.svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="white" strokeWidth={3.5}>
          <motion.path
            d="M5 12.5l4.5 4.5L19 7.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.25 }}
          />
        </motion.svg>
      )}
    </motion.span>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  accent = 'violet',
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  accent?: Accent;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          type="button"
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`chip ${value === o.value ? `${ACCENT[accent].soft} border-transparent` : 'text-muted hover:text-ink'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="card p-3.5">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="mt-0.5 text-2xl font-extrabold tabular-nums">{value}</p>
      {sub && <p className="text-xs text-muted">{sub}</p>}
    </div>
  );
}
