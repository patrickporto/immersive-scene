import { motion } from 'framer-motion';

import { VUMeter } from './VUMeter';
import { Cluster } from '../../../shared/components/layout/Cluster';
import { cn } from '../../../shared/utils/cn';
import { ChannelType } from '../stores/mixerStore';

interface MixerChannelStripProps {
  type: ChannelType;
  channel: {
    volume: number;
    muted: boolean;
    solo: boolean;
  };
  hasSolo: boolean;
  isSimulating: boolean;
  onToggleMute: (channel: ChannelType) => void;
  onToggleSolo: (channel: ChannelType) => void;
  onVolumeChange: (channel: ChannelType, volume: number) => void;
}

/**
 * @description Renders one mixer channel strip with solo/mute and volume controls.
 * @param props - Component properties.
 * @returns Channel strip view.
 */
export function MixerChannelStrip({
  type,
  channel,
  hasSolo,
  isSimulating,
  onToggleMute,
  onToggleSolo,
  onVolumeChange,
}: MixerChannelStripProps) {
  return (
    <div
      className={cn(
        'bg-black/40 rounded-xl p-5 border transition-all duration-300',
        channel.solo
          ? 'border-yellow-500/30 shadow-[0_0_20px_rgba(234,179,8,0.05)]'
          : 'border-white/5'
      )}
    >
      <Cluster justify="between" className="mb-3">
        <span
          className={cn(
            'text-[10px] font-bold uppercase tracking-widest',
            channel.muted ? 'text-gray-600' : 'text-cyan-400'
          )}
        >
          {type}
        </span>
        <Cluster gap={2}>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => onToggleMute(type)}
            className={cn(
              'px-2 py-0.5 rounded text-[8px] font-bold uppercase transition-all border',
              channel.muted
                ? 'bg-red-500 text-black border-red-500'
                : 'bg-transparent border-white/10 text-gray-600'
            )}
          >
            Mute
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => onToggleSolo(type)}
            className={cn(
              'px-2 py-0.5 rounded text-[8px] font-bold uppercase transition-all border',
              channel.solo
                ? 'bg-yellow-500 text-black border-yellow-500'
                : 'bg-transparent border-white/10 text-gray-600'
            )}
          >
            Solo
          </motion.button>
        </Cluster>
      </Cluster>

      <div className="flex gap-3 h-24">
        <div className="w-3">
          <VUMeter isActive={isSimulating && !channel.muted && (!hasSolo || channel.solo)} />
        </div>
        <div className="flex-1 flex flex-col justify-center">
          <div className="h-1.5 w-full bg-black/60 rounded-full relative border border-white/5 overflow-hidden">
            <motion.div
              className={cn(
                'absolute inset-y-0 left-0 transition-all duration-75',
                channel.muted ? 'bg-gray-800' : 'bg-cyan-500'
              )}
              style={{ width: `${channel.volume}%` }}
            />
            <input
              type="range"
              min="0"
              max="100"
              value={channel.volume}
              onChange={event => onVolumeChange(type, Number(event.target.value))}
              className="absolute inset-0 w-full opacity-0 cursor-pointer"
            />
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-[9px] font-mono text-gray-600">Volume</span>
            <span className="text-[9px] font-mono text-cyan-400">{channel.volume}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
