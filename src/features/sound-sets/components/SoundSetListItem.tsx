import { motion } from 'framer-motion';
import { Trash2, Upload } from 'lucide-react';

import { Cluster } from '../../../shared/components/layout/Cluster';
import { cn } from '../../../shared/utils/cn';

interface SoundSetListItemProps {
  id: number;
  name: string;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onExport: () => void;
}

/**
 * @description Displays one selectable sound set row.
 * @param props - Component properties.
 * @returns Sound set list row.
 */
export function SoundSetListItem({
  id,
  name,
  isSelected,
  onSelect,
  onDelete,
  onExport,
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
          : 'bg-transparent border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/[0.02]'
      )}
    >
      <Cluster className="px-4 py-3" justify="between" align="center">
        <span className="text-sm font-bold truncate tracking-tight">{name}</span>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 flex-shrink-0 transition-all">
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
