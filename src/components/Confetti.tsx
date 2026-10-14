import { AnimatePresence, motion } from 'framer-motion';
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

const COLORS = ['#3b82f6', '#06b6d4', '#f97316', '#10b981', '#0ea5e9', '#eab308'];

const ConfettiCtx = createContext<(message?: string) => void>(() => {});
export const useCelebrate = () => useContext(ConfettiCtx);

export function ConfettiProvider({ children }: { children: ReactNode }) {
  const [burst, setBurst] = useState<{ key: number; message?: string } | null>(null);

  const celebrate = useCallback((message?: string) => {
    const key = Date.now();
    setBurst({ key, message });
    setTimeout(() => setBurst((b) => (b?.key === key ? null : b)), 2200);
  }, []);

  return (
    <ConfettiCtx.Provider value={celebrate}>
      {children}
      <AnimatePresence>
        {burst && (
          <div key={burst.key} className="pointer-events-none fixed inset-0 z-[60] overflow-hidden">
            {Array.from({ length: 36 }).map((_, i) => {
              const x = (Math.random() - 0.5) * 700;
              const y = -200 - Math.random() * 400;
              return (
                <motion.span
                  key={i}
                  className="absolute left-1/2 top-1/2 h-2.5 w-2 rounded-sm"
                  style={{ background: COLORS[i % COLORS.length] }}
                  initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
                  animate={{ x, y: [0, y, y + 700], opacity: [1, 1, 0], rotate: Math.random() * 720 }}
                  transition={{ duration: 1.8, ease: 'easeOut' }}
                />
              );
            })}
            {burst.message && (
              <motion.div
                initial={{ scale: 0.5, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                className="absolute inset-x-0 top-1/3 mx-auto w-fit rounded-3xl bg-surface px-6 py-4 text-center text-lg font-bold shadow-2xl"
              >
                {burst.message}
              </motion.div>
            )}
          </div>
        )}
      </AnimatePresence>
    </ConfettiCtx.Provider>
  );
}
