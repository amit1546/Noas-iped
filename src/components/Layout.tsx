import { AnimatePresence, motion } from 'framer-motion';
import { Apple, CalendarCheck, CalendarDays, LayoutDashboard, Settings } from 'lucide-react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';

const NAV = [
  { to: '/', label: 'היום', icon: CalendarCheck, color: 'text-blue-600 dark:text-blue-400' },
  { to: '/calendar', label: 'לוח שנה', icon: CalendarDays, color: 'text-indigo-600 dark:text-indigo-400' },
  { to: '/nutrition', label: 'תזונה', icon: Apple, color: 'text-sky-600 dark:text-sky-400' },
  { to: '/dashboard', label: 'סיכום', icon: LayoutDashboard, color: 'text-sky-600 dark:text-sky-400' },
];

export function Layout() {
  const location = useLocation();
  return (
    <div className="min-h-dvh md:flex">
      {/* Side nav (tablet / desktop) */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-l border-line bg-surface p-4 md:flex">
        <div className="mb-8 flex items-center gap-2 px-2 pt-2">
          <img src="./icon.svg" alt="" className="h-9 w-9" />
          <span className="text-xl font-extrabold">היומן שלי</span>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {[...NAV, { to: '/settings', label: 'הגדרות', icon: Settings, color: 'text-slate-600 dark:text-slate-300' }].map(
            ({ to, label, icon: Icon, color }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex min-h-[48px] items-center gap-3 rounded-2xl px-3 font-semibold transition ${
                    isActive ? `bg-canvas ${color}` : 'text-muted hover:bg-canvas hover:text-ink'
                  }`
                }
              >
                <Icon size={22} />
                {label}
              </NavLink>
            ),
          )}
        </nav>
      </aside>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-32 pt-[max(1.25rem,env(safe-area-inset-top))] md:px-8 md:pb-12 md:pt-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom nav (phone) */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg md:hidden">
        <div className="mx-auto flex max-w-lg justify-around px-1">
          {NAV.map(({ to, label, icon: Icon, color }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `relative flex min-h-[60px] flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition ${
                  isActive ? color : 'text-muted'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-x-3 top-1.5 h-8 rounded-full bg-canvas"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <Icon size={22} className="relative" />
                  <span className="relative">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
