import { motion } from 'framer-motion';
import { Trash2, Upload, Eye, EyeOff, Check } from 'lucide-react';

import { Cluster } from '../../../shared/components/layout/Cluster';
import { cn } from '../../../shared/utils/cn';

interface SoundSetListItemProps {
  id: number;
  name: string;
  isEnabled: boolean;
  isSelected: boolean;
  isViewSelected: boolean;
  onSelect: () => void;
  onToggleView: () => void;
  onDelete: () => void;
  onExport: () => void;
  onToggleEnabled: () => void;
}

/**
 * @description Displays one selectable sound set row.
 * @param props - Component properties.
 * @returns Sound set list row.
 */
export function SoundSetListItem({
  id,
  name,
  isEnabled,
  isSelected,
  isViewSelected,
  onSelect,
  onToggleView,
  onDelete,
  onExport,
  onToggleEnabled,
}: SoundSetListItemProps) {
  return (
    <motion.div
      layout
      key={id}
      onClick={onSelect}
      className={cn(
        'group relative cursor-pointer transition-all border rounded-xl',
        isSelected
          ? 'bg-cyan-500/10 border-cyan-500/30 text-white shadow-[0_0_15px_rgba(0,212,255,0.1)]'
          : 'bg-transparent border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/[0.02]',
        !isEnabled && !isSelected && 'opacity-60 grayscale'
      )}
    >
      <Cluster className="px-4 py-3" justify="start" align="center" gap={3}>
        <button
          type="button"
          onClick={e => {
            e.stopPropagation();
            onToggleView();
          }}
          className={cn(
            'w-4 h-4 rounded border transition-all flex items-center justify-center shrink-0',
            isViewSelected
              ? 'bg-cyan-500 border-cyan-400 text-black shadow-[0_0_8px_rgba(0,212,255,0.4)]'
              : 'border-white/20 bg-white/5 text-transparent hover:border-white/40'
          )}
        >
          {isViewSelected && <Check className="w-3 h-3 stroke-[3]" />}
        </button>

        <span
          className={cn(
            'text-sm font-bold truncate tracking-tight flex-1',
            !isEnabled && 'line-through opacity-70'
          )}
        >
          {name}
        </span>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 flex-shrink-0 transition-all">
          <button
            type="button"
            className="focus:outline-none"
            onClick={event => {
              event.stopPropagation();
              onToggleEnabled();
            }}
          >
            {isEnabled ? (
              <Eye className="w-3.5 h-3.5 hover:text-cyan-400 transition-colors" />
            ) : (
              <EyeOff className="w-3.5 h-3.5 text-gray-500 hover:text-cyan-400 transition-colors" />
            )}
          </button>
          <Upload
            className="w-3.5 h-3.5 hover:text-cyan-400 transition-colors"
            onClick={event => {
              event.stopPropagation();
              onExport();
            }}
          />
          <Trash2
            className="w-3.5 h-3.5 hover:text-red-500 transition-colors"
            onClick={event => {
              event.stopPropagation();
              onDelete();
            }}
          />
        </div>
      </Cluster>

      {isSelected && (
        <motion.div
          layoutId="activeSoundSet"
          className="absolute left-0 top-2 bottom-2 w-0.5 bg-cyan-500 rounded-full shadow-[0_0_10px_rgba(0,212,255,1)]"
        />
      )}
    </motion.div>
  );
}
