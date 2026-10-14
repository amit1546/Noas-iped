import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { ACCENT, type Accent } from '../lib/accent';

export function Fab({ onClick, label, accent }: { onClick: () => void; label: string; accent: Accent }) {
  return (
    <motion.button
      onClick={onClick}
      aria-label={label}
      title={label}
      whileTap={{ scale: 0.9 }}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className={`fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] left-5 z-30 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-lg md:bottom-8 md:left-8 ${ACCENT[accent].gradient}`}
    >
      <Plus size={28} strokeWidth={2.5} />
    </motion.button>
  );
}
