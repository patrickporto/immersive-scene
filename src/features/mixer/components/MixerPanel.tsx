import { useEffect, useState } from 'react';

import { motion } from 'framer-motion';

import { cn } from '../../../shared/utils/cn';
import { useAudioEngineStore } from '../../audio-engine/stores/audioEngineStore';
import { ChannelType, useMixerStore } from '../stores/mixerStore';

const CHANNEL_CONFIG: Record<ChannelType, { label: string; color: string; gradient: string }> = {
  music: {
    label: 'Música',
    color: 'bg-purple-500',
    gradient: 'from-purple-500 to-purple-600',
  },
  ambient: {
    label: 'Ambiente',
    color: 'bg-blue-500',
    gradient: 'from-blue-500 to-blue-600',
  },
  effects: {
    label: 'Efeitos',
    color: 'bg-emerald-500',
    gradient: 'from-emerald-500 to-emerald-600',
  },
  creatures: {
    label: 'Criaturas',
    color: 'bg-orange-500',
    gradient: 'from-orange-500 to-orange-600',
  },
  voice: {
    label: 'Voz',
    color: 'bg-rose-500',
    gradient: 'from-rose-500 to-rose-600',
  },
};

function VUMeter({ level, color }: { level: number; color: string }) {
  const bars = 12;
  const activeBars = Math.floor((level / 100) * bars);

  return (
    <div className="flex gap-[2px] h-full items-end">
      {Array.from({ length: bars }).map((_, i) => {
        const isActive = i < activeBars;
        const isPeak = i >= bars - 3;

        return (
          <motion.div
            key={i}
            initial={false}
            animate={{
              opacity: isActive ? 1 : 0.2,
              scaleY: isActive ? 1 : 0.5,
            }}
            transition={{ duration: 0.05 }}
            className={cn(
              'w-1 rounded-sm flex-1',
              isActive
                ? isPeak
                  ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'
                  : color
                : 'bg-gray-700'
            )}
          />
        );
      })}
    </div>
  );
}

export function MixerPanel() {
  const {
    channels,
    masterVolume,
    masterMuted,
    isPlaying,
    setChannelVolume,
    toggleChannelMute,
    toggleChannelSolo,
    setMasterVolume,
    toggleMasterMute,
    setIsPlaying,
    resetMixer,
  } = useMixerStore();

  const { stopAll } = useAudioEngineStore();
  const [vuLevels, setVuLevels] = useState<Record<ChannelType, number>>({
    music: 0,
    ambient: 0,
    effects: 0,
    creatures: 0,
    voice: 0,
  });

  // Simular VU meters quando está tocando
  useEffect(() => {
    if (!isPlaying) {
      return;
    }

    const interval = setInterval(() => {
      setVuLevels(prev => {
        const newLevels: Record<ChannelType, number> = { ...prev };
        (Object.keys(channels) as ChannelType[]).forEach(channel => {
          if (channels[channel].muted) {
            newLevels[channel] = 0;
          } else {
            // Simular atividade de áudio
            const baseLevel = channels[channel].volume * 0.8;
            const variation = Math.random() * 30 - 15;
            newLevels[channel] = Math.max(0, Math.min(100, baseLevel + variation));
          }
        });
        return newLevels;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [isPlaying, channels]);

  // Reset VU levels when stopped
  useEffect(() => {
    if (!isPlaying) {
      const timer = setTimeout(() => {
        setVuLevels({
          music: 0,
          ambient: 0,
          effects: 0,
          creatures: 0,
          voice: 0,
        });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isPlaying]);

  const handlePlayAll = () => {
    setIsPlaying(true);
  };

  const handleStopAll = () => {
    setIsPlaying(false);
    stopAll();
  };

  const hasSolo = Object.values(channels).some(ch => ch.solo);

  return (
    <div className="h-full flex flex-col p-4 bg-[#0a0a0f]">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 animate-pulse" />
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Mixer
            </span>
          </div>
          {hasSolo && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/20">
              Solo Ativo
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={isPlaying ? handleStopAll : handlePlayAll}
            className={cn(
              'px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all',
              isPlaying
                ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'
                : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/25'
            )}
          >
            {isPlaying ? (
              <>
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="6" width="12" height="12" />
                </svg>
                Stop All
              </>
            ) : (
              <>
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Play All
              </>
            )}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={resetMixer}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-white bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] transition-colors"
          >
            Reset
          </motion.button>
        </div>
      </div>

      {/* Channels */}
      <div className="flex-1 flex gap-3 overflow-x-auto pb-2">
        {/* Master Channel */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-24 bg-[#1a1a25] border border-white/[0.08] rounded-xl p-3 flex flex-col shrink-0"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
              Master
            </span>
          </div>

          <div className="flex-1 flex gap-2">
            <div className="flex-1">
              <VUMeter level={isPlaying && !masterMuted ? masterVolume : 0} color="bg-white" />
            </div>

            <div className="w-8 flex flex-col items-center gap-1">
              <div className="flex-1 relative w-full">
                <div className="absolute inset-x-0 top-0 bottom-4 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white/80 to-white transition-all duration-75"
                    style={{ height: `${masterMuted ? 0 : masterVolume}%` }}
                  />
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={masterMuted ? 0 : masterVolume}
                  onChange={e => setMasterVolume(Number(e.target.value))}
                  className="absolute inset-0 w-full opacity-0 cursor-pointer"
                  style={{ WebkitAppearance: 'slider-vertical' }}
                />
              </div>

              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={toggleMasterMute}
                className={cn(
                  'w-7 h-7 rounded-lg flex items-center justify-center transition-colors text-xs font-bold',
                  masterMuted
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-white/[0.05] text-gray-400 hover:text-white hover:bg-white/[0.1]'
                )}
              >
                M
              </motion.button>
            </div>
          </div>

          <div className="mt-2 text-center">
            <span className="text-[10px] font-mono text-gray-500">
              {masterMuted ? '-∞' : `${masterVolume}%`}
            </span>
          </div>
        </motion.div>

        <div className="w-px bg-white/[0.08] mx-1 shrink-0" />

        {/* Individual Channels */}
        {(Object.keys(channels) as ChannelType[]).map((channel, index) => {
          const channelState = channels[channel];
          const config = CHANNEL_CONFIG[channel];
          const isActive = !channelState.muted && !masterMuted;
          const isSoloActive = channelState.solo;

          return (
            <motion.div
              key={channel}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                'w-24 bg-[#1a1a25] border rounded-xl p-3 flex flex-col shrink-0 transition-all',
                isSoloActive ? 'border-yellow-500/30 bg-yellow-500/[0.03]' : 'border-white/[0.08]'
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider truncate">
                  {config.label}
                </span>
              </div>

              <div className="flex-1 flex gap-2">
                <div className="flex-1">
                  <VUMeter level={isActive ? vuLevels[channel] : 0} color={config.color} />
                </div>

                <div className="w-8 flex flex-col items-center gap-1">
                  <div className="flex-1 relative w-full">
                    <div className="absolute inset-x-0 top-0 bottom-4 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'absolute bottom-0 left-0 right-0 transition-all duration-75',
                          isActive ? `bg-gradient-to-t ${config.gradient}` : 'bg-gray-700'
                        )}
                        style={{ height: `${channelState.muted ? 0 : channelState.volume}%` }}
                      />
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={channelState.muted ? 0 : channelState.volume}
                      onChange={e => setChannelVolume(channel, Number(e.target.value))}
                      className="absolute inset-0 w-full opacity-0 cursor-pointer"
                      style={{ WebkitAppearance: 'slider-vertical' }}
                    />
                  </div>

                  <div className="flex gap-1">
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => toggleChannelMute(channel)}
                      className={cn(
                        'w-6 h-6 rounded-lg flex items-center justify-center transition-colors text-[9px] font-bold',
                        channelState.muted
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-white/[0.05] text-gray-500 hover:text-gray-300'
                      )}
                    >
                      M
                    </motion.button>

                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => toggleChannelSolo(channel)}
                      className={cn(
                        'w-6 h-6 rounded-lg flex items-center justify-center transition-colors text-[9px] font-bold',
                        channelState.solo
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-white/[0.05] text-gray-500 hover:text-gray-300'
                      )}
                    >
                      S
                    </motion.button>
                  </div>
                </div>
              </div>

              <div className="mt-2 text-center">
                <span className="text-[10px] font-mono text-gray-500">
                  {channelState.muted ? '-∞' : `${channelState.volume}`}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
