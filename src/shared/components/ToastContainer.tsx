import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle2, Info, X, XCircle } from 'lucide-react';

import { useToastStore } from '../stores/toastStore';
import { cn } from '../utils/cn';

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map(t => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            layout
            className={cn(
              'pointer-events-auto flex items-center gap-4 px-6 py-4 rounded-2xl border shadow-2xl backdrop-blur-xl min-w-[320px] max-w-md',
              t.type === 'success' && 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
              t.type === 'error' && 'bg-red-500/10 border-red-500/20 text-red-400',
              t.type === 'warning' && 'bg-amber-500/10 border-amber-500/20 text-amber-400',
              t.type === 'info' && 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'
            )}
          >
            {t.type === 'success' && <CheckCircle2 className="w-5 h-5 shrink-0" />}
            {t.type === 'error' && <XCircle className="w-5 h-5 shrink-0" />}
            {t.type === 'warning' && <AlertCircle className="w-5 h-5 shrink-0" />}
            {t.type === 'info' && <Info className="w-5 h-5 shrink-0" />}

            <p className="text-sm font-bold uppercase tracking-widest flex-1">{t.message}</p>

            <button
              onClick={() => removeToast(t.id)}
              className="p-1 hover:bg-white/5 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 opacity-50 hover:opacity-100" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
