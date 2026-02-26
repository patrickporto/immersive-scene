import { motion } from 'framer-motion';

import { Stack } from '../../../shared/components/layout/Stack';

interface MixerMasterSectionProps {
  masterVolume: number;
  onVolumeChange: (value: number) => void;
}

/**
 * @description Renders mixer master output volume controls.
 * @param props - Component properties.
 * @returns Master output section.
 */
export function MixerMasterSection({ masterVolume, onVolumeChange }: MixerMasterSectionProps) {
  return (
    <div className="p-5 bg-black/40 border-t border-white/10">
      <Stack gap={3}>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-white uppercase tracking-widest">
            Master Output
          </span>
          <span className="text-[10px] font-mono text-cyan-400">{masterVolume}%</span>
        </div>
        <div className="h-2 w-full bg-black/60 rounded-full relative border border-white/5 overflow-hidden shadow-inner">
          <motion.div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-600 to-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]"
            style={{ width: `${masterVolume}%` }}
          />
          <input
            type="range"
            min="0"
            max="100"
            value={masterVolume}
            onChange={event => onVolumeChange(Number(event.target.value))}
            className="absolute inset-0 w-full opacity-0 cursor-pointer"
          />
        </div>
      </Stack>
    </div>
  );
}
