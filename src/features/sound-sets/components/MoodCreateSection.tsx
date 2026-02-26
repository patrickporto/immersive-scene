import type { FormEvent } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { Plus } from 'lucide-react';

import { Cluster } from '../../../shared/components/layout/Cluster';
import { Stack } from '../../../shared/components/layout/Stack';

interface MoodCreateSectionProps {
  isCreating: boolean;
  value: string;
  onValueChange: (value: string) => void;
  onStart: () => void;
  onCancel: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

/**
 * @description Renders create mood CTA and inline form.
 * @param props - Component properties.
 * @returns Create mood section.
 */
export function MoodCreateSection({
  isCreating,
  value,
  onValueChange,
  onStart,
  onCancel,
  onSubmit,
}: MoodCreateSectionProps) {
  return (
    <AnimatePresence mode="wait">
      {!isCreating ? (
        <motion.div
          layout
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={onStart}
          className="group cursor-pointer transition-all border border-dashed border-white/10 hover:border-cyan-500/50 hover:bg-cyan-500/5 rounded-lg"
        >
          <Cluster className="px-4 py-2" gap={2} justify="center">
            <Plus className="w-3 h-3 text-gray-500 group-hover:text-cyan-400 transition-colors" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 group-hover:text-cyan-400 transition-colors">
              Add Mood
            </span>
          </Cluster>
        </motion.div>
      ) : (
        <motion.form
          layout
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onSubmit={onSubmit}
          className="p-3 bg-black/40 rounded-lg border border-cyan-500/30"
        >
          <Stack gap={2}>
            <input
              type="text"
              placeholder="New Mood..."
              value={value}
              onChange={event => onValueChange(event.target.value)}
              autoFocus
              className="w-full bg-black/40 border border-white/10 rounded px-3 py-1.5 text-xs text-white placeholder:text-gray-600 focus:border-cyan-500/50 outline-none"
            />
            <Cluster justify="between" gap={2}>
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 text-[9px] font-bold uppercase py-1.5 rounded text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-cyan-500 text-black text-[9px] font-bold uppercase py-1.5 rounded hover:bg-cyan-400 transition-colors"
              >
                Create
              </button>
            </Cluster>
          </Stack>
        </motion.form>
      )}
    </AnimatePresence>
  );
}
