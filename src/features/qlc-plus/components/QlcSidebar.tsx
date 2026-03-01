import React from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCcw, Zap, Search, SlidersHorizontal } from 'lucide-react';

import { QlcFunctionBrowser } from './QlcFunctionBrowser';
import { cn } from '../../../shared/utils/cn';
import { useQlcPlusStore } from '../stores/qlcPlusStore';

export const QlcSidebar: React.FC = () => {
  const { loadFunctions, sendPanic, isLoading } = useQlcPlusStore();

  return (
    <motion.aside
      initial={{ x: 320, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 320, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="w-80 flex-shrink-0 border-l border-white/5 bg-[#0f0f15]/95 backdrop-blur-xl flex flex-col h-full shadow-2xl z-20"
    >
      <div className="p-6 pb-2">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">
              Lighting
            </h2>
            <h3 className="text-lg font-bold text-white tracking-tight">QLC+ Control</h3>
          </div>
          <button
            onClick={() => void loadFunctions()}
            disabled={isLoading}
            className={cn(
              'p-2 rounded-full hover:bg-white/5 text-zinc-400 hover:text-cyan-400 transition-all',
              isLoading && 'animate-spin text-cyan-500'
            )}
            title="Refresh Functions"
          >
            <RefreshCcw size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        <QlcFunctionBrowser />
      </div>

      <div className="p-6 border-t border-white/5 space-y-4 bg-black/20">
        <button
          onClick={() => void sendPanic()}
          className="w-full group relative overflow-hidden flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all duration-300 font-bold uppercase tracking-widest text-[11px]"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-red-600/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
          <Zap size={16} className="relative z-10" />
          <span className="relative z-10">Panic (All Off)</span>
        </button>

        <div className="flex items-center justify-center gap-2 text-[10px] text-zinc-600 font-medium uppercase tracking-wider">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Active Connection</span>
        </div>
      </div>
    </motion.aside>
  );
};
