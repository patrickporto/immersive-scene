import type { MouseEvent } from 'react';

import { motion } from 'framer-motion';

import { IconPause, IconPlay, IconRepeat, IconTrash } from '../../../shared/components/Icons';
import { Waveform } from '../../../shared/components/Waveform';
import { useToast } from '../../../shared/hooks/useToast';
import { cn } from '../../../shared/utils/cn';
import { useAudioEngineStore } from '../../audio-engine/stores/audioEngineStore';
import { useMixerStore, ChannelType } from '../../mixer/stores/mixerStore';
import { useGlobalOneShotStore } from '../stores/globalOneShotStore';
import { AudioElement } from '../stores/soundSetStore';

interface GlobalOneShotCardProps {
  element: AudioElement;
}

export function GlobalOneShotCard({ element }: GlobalOneShotCardProps) {
  const { play, pause, stop, sources, toggleLoop, selectedElementId, setSelectedElementId } =
    useAudioEngineStore();
  const { deleteGlobalOneShot } = useGlobalOneShotStore();
  const { channels, setChannelVolume } = useMixerStore();
  const { success, error } = useToast();

  const source = sources.get(element.id);
  const isPlaying = source?.isPlaying || false;
  const isLooping = source?.isLooping || false;

  const channelInfo = channels[element.channel_type as ChannelType] || {
    volume: 80,
    isMuted: false,
    isSoloed: false,
  };

  const handleDelete = async () => {
    try {
      stop(element.id);
      await deleteGlobalOneShot(element.id);
      success(`Global One-shot "${element.file_name}" removed`);
    } catch {
      error('Failed to remove global one-shot');
    }
  };

  const handleCardClick = () => {
    setSelectedElementId(element.id);
    if (isPlaying) {
      pause(element.id);
    } else {
      play(element.id);
    }
  };

  const handlePrimaryAction = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (isPlaying) {
      pause(element.id);
    } else {
      play(element.id);
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      onClick={handleCardClick}
      className={cn(
        'border rounded-xl p-3 flex items-center justify-between h-[80px] transition-all relative overflow-hidden cursor-pointer group/card gap-3',
        isPlaying
          ? 'border-fuchsia-400 shadow-[0_0_30px_rgba(232,121,249,0.3)] bg-gradient-to-br from-[#1a1a25] to-fuchsia-900/30'
          : 'border-white/[0.05] bg-[#1a1a25]',
        selectedElementId === element.id && 'border-fuchsia-500 ring-1 ring-fuchsia-500/30'
      )}
    >
      {isPlaying && (
        <div className="absolute inset-0 opacity-10 pointer-events-none flex items-center justify-center overflow-hidden">
          <Waveform isPlaying={isPlaying} height={80} barCount={40} color="bg-fuchsia-400" />
        </div>
      )}

      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={handlePrimaryAction}
        className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-lg shrink-0 z-10',
          isPlaying
            ? 'bg-fuchsia-400 text-black shadow-[0_0_15px_rgba(232,121,249,0.6)]'
            : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
        )}
      >
        {isPlaying ? <IconPause className="w-5 h-5" /> : <IconPlay className="w-5 h-5 ml-0.5" />}
      </motion.button>

      <div className="flex-1 flex flex-col justify-center min-w-0 z-10">
        <p
          className="text-[12px] font-bold text-gray-300 truncate w-full"
          title={element.file_name}
        >
          {element.file_name.split('.')[0]}
        </p>

        <div className="flex items-center gap-2 mt-1 relative">
          <motion.button
            onClick={event => {
              event.stopPropagation();
              toggleLoop(element.id);
            }}
            className={cn(
              'flex items-center gap-1 px-1.5 py-0.5 rounded transition-all border',
              isLooping
                ? 'text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/30 shadow-[0_0_10px_rgba(232,121,249,0.1)]'
                : 'text-gray-500 bg-transparent border-transparent hover:text-gray-300 hover:bg-white/5 hover:border-white/10'
            )}
            title={isLooping ? 'Disable Loop' : 'Enable Loop'}
          >
            <IconRepeat className="w-3 h-3" />
            <span className="text-[8px] font-bold uppercase tracking-wider">
              {isLooping ? 'Loop' : '1-Shot'}
            </span>
          </motion.button>

          <button
            onClick={event => {
              event.stopPropagation();
              void handleDelete();
            }}
            className="p-1 text-gray-600 hover:text-red-500 transition-colors opacity-0 group-hover/card:opacity-100"
            title="Remove One-shot"
          >
            <IconTrash className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="w-20 lg:w-24 flex items-center gap-2 group/slider shrink-0 z-10 pr-1">
        <div className="flex-1 relative h-1.5 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
          <motion.div
            className={cn(
              'absolute top-0 left-0 bottom-0 transition-all duration-75',
              isPlaying ? 'bg-fuchsia-400 shadow-[0_0_10px_rgba(232,121,249,0.5)]' : 'bg-gray-700'
            )}
            style={{ width: `${channelInfo.volume}%` }}
          />
          <input
            type="range"
            min="0"
            max="100"
            value={channelInfo.volume}
            onChange={event =>
              setChannelVolume(element.channel_type as ChannelType, Number(event.target.value))
            }
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>
        <span className="text-[9px] font-bold text-gray-500 w-5 text-right">
          {channelInfo.volume}
        </span>
      </div>
    </motion.div>
  );
}
