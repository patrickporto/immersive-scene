import { useEffect, useMemo, useState } from 'react';

import { Draggable, Droppable } from '@hello-pangea/dnd';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle,
  Play,
  Power,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Layers,
} from 'lucide-react';

import { cn } from '../../../shared/utils/cn';
import { useQlcPlusStore } from '../stores/qlcPlusStore';

/**
 * @description lists QLC+ functions with premium Vercel/Apple style UI.
 * @returns Rendered QLC+ function browser panel for the sidebar.
 */
export function QlcFunctionBrowser() {
  const {
    functions,
    statuses,
    statusMessages,
    isLoading,
    error,
    loadFunctions,
    triggerFunction,
    stopFunction,
    setFunctionParameter,
    clearError,
  } = useQlcPlusStore();

  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [parameterDrafts, setParameterDrafts] = useState<Record<string, number>>({});

  useEffect(() => {
    void loadFunctions();
  }, [loadFunctions]);

  const functionTypes = useMemo(() => {
    const unique = new Set(functions.map(fn => fn.function_type));
    return ['all', ...Array.from(unique).sort()];
  }, [functions]);

  const filteredFunctions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return functions
      .filter(fn => (filterType === 'all' ? true : fn.function_type === filterType))
      .filter(fn => {
        if (!normalizedQuery) return true;
        return (
          fn.name.toLowerCase().includes(normalizedQuery) ||
          fn.id.toLowerCase().includes(normalizedQuery) ||
          fn.function_type.toLowerCase().includes(normalizedQuery)
        );
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [functions, filterType, query]);

  return (
    <div className="flex flex-col h-full">
      {/* Search and Filter */}
      <div className="px-6 space-y-3 mb-4">
        <div className="relative group">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-cyan-400 transition-colors"
          />
          <input
            type="search"
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="Search cues..."
            className="w-full bg-zinc-900 border border-white/5 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all font-medium"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-zinc-900 border border-white/5 text-zinc-500">
            <SlidersHorizontal size={12} />
          </div>
          <select
            value={filterType}
            onChange={event => setFilterType(event.target.value)}
            className="flex-1 bg-zinc-900 border border-white/5 rounded-lg px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400 outline-none focus:ring-1 focus:ring-cyan-500/50 cursor-pointer hover:bg-zinc-800 transition-all"
          >
            {functionTypes.map(type => (
              <option key={type} value={type}>
                {type === 'all' ? 'All Types' : type}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="px-6 mb-4"
        >
          <div className="flex items-center gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-[11px] text-red-400 font-medium">
            <AlertCircle size={14} className="shrink-0" />
            <span className="flex-1 truncate">{error}</span>
            <button
              onClick={clearError}
              className="p-1 hover:bg-white/10 rounded-md transition-colors"
            >
              &times;
            </button>
          </div>
        </motion.div>
      )}

      {/* Function List */}
      <Droppable droppableId="qlc-functions" isDropDisabled>
        {provided => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="flex-1 overflow-y-auto px-6 space-y-2 pb-6 custom-scrollbar"
          >
            <AnimatePresence mode="popLayout">
              {isLoading && functions.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center text-zinc-600 gap-4">
                  <div className="w-8 h-8 rounded-full border-2 border-zinc-800 border-t-cyan-500 animate-spin" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em]">
                    Synchronizing...
                  </span>
                </div>
              ) : filteredFunctions.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center text-zinc-600 gap-3 grayscale opacity-40">
                  <Layers size={32} />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em]">
                    No Matches
                  </span>
                </div>
              ) : (
                filteredFunctions.map((fn, index) => (
                  <Draggable key={fn.id} draggableId={`qlc-function-${fn.id}`} index={index}>
                    {dragProvided => (
                      <article
                        ref={dragProvided.innerRef}
                        {...dragProvided.draggableProps}
                        {...dragProvided.dragHandleProps}
                        className={cn(
                          'group relative rounded-2xl border bg-white/[0.02] p-4 transition-all duration-300 hover:bg-white/[0.04]',
                          statuses[fn.id] === 'error' ? 'border-red-500/30' : 'border-white/5'
                        )}
                      >
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-white tracking-tight group-hover:text-cyan-400 transition-colors truncate">
                              {fn.name}
                            </h4>
                            <p className="text-[10px] text-zinc-600 font-mono tracking-tighter uppercase mt-0.5">
                              {fn.function_type}
                            </p>
                          </div>

                          {/* Live Status Indicator */}
                          <div className="flex flex-col items-end">
                            <AnimatePresence>
                              {statuses[fn.id] && statuses[fn.id] !== 'idle' && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.8 }}
                                  className={cn(
                                    'px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter shadow-lg mb-1',
                                    statuses[fn.id] === 'success'
                                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                      : statuses[fn.id] === 'pending'
                                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 animate-pulse'
                                        : 'bg-red-500/20 text-red-300 border border-red-500/30'
                                  )}
                                >
                                  {statuses[fn.id]}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>

                        {/* Quick Controls */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => void triggerFunction(fn.id, 'start')}
                            className="flex-1 flex items-center justify-center gap-2 h-9 rounded-xl bg-cyan-500 text-black hover:bg-cyan-400 active:scale-95 transition-all text-[11px] font-black uppercase tracking-widest shadow-lg shadow-cyan-500/10"
                          >
                            <Play size={12} fill="currentColor" />
                            <span>Run</span>
                          </button>
                          <button
                            onClick={() => void stopFunction(fn.id)}
                            className="w-12 flex items-center justify-center h-9 rounded-xl bg-white/5 border border-white/5 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all"
                            title="Kill"
                          >
                            <Power size={14} />
                          </button>
                          {fn.supports_toggle && (
                            <button
                              onClick={() => void triggerFunction(fn.id, 'toggle')}
                              className="w-12 flex items-center justify-center h-9 rounded-xl bg-white/5 border border-white/5 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all"
                              title="Toggle"
                            >
                              <RefreshCw size={14} />
                            </button>
                          )}
                        </div>

                        {/* Parameter Controls (Nested) */}
                        {fn.supports_parameter && fn.parameter_name && (
                          <div className="mt-4 pt-4 border-t border-white/5 space-y-3">
                            <div className="flex justify-between items-center px-1">
                              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                                {fn.parameter_name}
                              </span>
                              <span className="text-[10px] font-mono font-bold text-cyan-500">
                                {Math.round(parameterDrafts[fn.id] ?? fn.parameter_min ?? 0)}
                              </span>
                            </div>
                            <div className="relative h-6 flex items-center">
                              <input
                                type="range"
                                min={fn.parameter_min ?? 0}
                                max={fn.parameter_max ?? 255}
                                value={parameterDrafts[fn.id] ?? fn.parameter_min ?? 0}
                                onChange={e =>
                                  setParameterDrafts(prev => ({
                                    ...prev,
                                    [fn.id]: Number(e.target.value),
                                  }))
                                }
                                onMouseUp={() =>
                                  void setFunctionParameter(
                                    fn.id,
                                    fn.parameter_name!,
                                    parameterDrafts[fn.id] ?? 0
                                  )
                                }
                                className="w-full h-1 bg-white/5 rounded-full appearance-none outline-none cursor-pointer slider-thumb-cyan"
                              />
                            </div>
                          </div>
                        )}
                      </article>
                    )}
                  </Draggable>
                ))
              )}
            </AnimatePresence>
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .slider-thumb-cyan::-webkit-slider-thumb {
          appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #06b6d4;
          cursor: pointer;
          border: 2px solid #fff;
          box-shadow: 0 0 15px rgba(6, 182, 212, 0.4);
        }
      `,
        }}
      />
    </div>
  );
}
