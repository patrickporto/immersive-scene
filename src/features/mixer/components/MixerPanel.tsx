import { useEffect, useRef, useState } from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, Info, Volume2, Music, Timer } from 'lucide-react';

import { Cluster } from '../../../shared/components/layout/Cluster';
import { Stack } from '../../../shared/components/layout/Stack';
import { cn } from '../../../shared/utils/cn';
import { useAudioEngineStore } from '../../audio-engine/stores/audioEngineStore';
import { ChannelType, useMixerStore } from '../stores/mixerStore';

function VUMeter({ isActive }: { isActive: boolean }) {
  const bars = 14;
  return (
    <div className="flex flex-col-reverse gap-[2px] h-full w-full">
      {Array.from({ length: bars }).map((_, i) => {
        const isPeak = i >= bars - 2;
        const isWarning = i >= bars - 5 && i < bars - 2;

        return (
          <div
            key={i}
            className={cn(
              'w-full flex-1 rounded-[1px] transition-all duration-300',
              isActive
                ? isPeak
                  ? 'bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.5)]'
                  : isWarning
                    ? 'bg-yellow-400'
                    : 'bg-cyan-500'
                : 'bg-white/5'
            )}
          />
        );
      })}
    </div>
  );
}

interface MixerPanelProps {
  isCollapsed?: boolean;
}

export function MixerPanel({ isCollapsed = false }: MixerPanelProps) {
  const {
    channels,
    masterVolume,
    isPlaying,
    setChannelVolume,
    toggleChannelMute,
    toggleChannelSolo,
    setMasterVolume,
    resetMixer,
  } = useMixerStore();

  const { selectedElementId, sources, setVolume, toggleLoop } = useAudioEngineStore();

  const [activeTab, setActiveTab] = useState<'mixer' | 'inspector'>('mixer');
  const isSimulating = isPlaying;

  // Auto-switch to inspector when an element is selected - using a ref to avoid cascading renders
  const prevSelectedElementId = useRef<number | null>(null);
  useEffect(() => {
    if (selectedElementId && selectedElementId !== prevSelectedElementId.current) {
      prevSelectedElementId.current = selectedElementId;
      // Use a microtask to avoid synchronous setState during render
      Promise.resolve().then(() => {
        setActiveTab('inspector');
      });
    }
  }, [selectedElementId]);

  const hasSolo = Object.values(channels).some(ch => ch.solo);
  const selectedSource = selectedElementId ? sources.get(selectedElementId) : null;

  if (isCollapsed) {
    return (
      <Stack className="h-full items-center py-4" gap={6}>
        <motion.button
          whileHover={{ scale: 1.1 }}
          onClick={() => setActiveTab(activeTab === 'mixer' ? 'inspector' : 'mixer')}
          className={cn(
            'p-2 rounded-lg transition-all border',
            activeTab === 'mixer'
              ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
              : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
          )}
        >
          {activeTab === 'mixer' ? (
            <SlidersHorizontal className="w-5 h-5" />
          ) : (
            <Info className="w-5 h-5" />
          )}
        </motion.button>

        <div className="flex-1 w-1 bg-white/5 rounded-full relative overflow-hidden">
          <motion.div
            className="absolute bottom-0 left-0 right-0 bg-cyan-500"
            style={{ height: `${masterVolume}%` }}
          />
        </div>

        <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_8px_rgba(0,212,255,0.5)]" />
      </Stack>
    );
  }

  return (
    <Stack className="h-full bg-[#0f0f15] border-l border-white/5">
      {/* Mixer Header / Tabs */}
      <div className="p-4 bg-black/20 border-b border-white/5">
        <Cluster justify="between" align="center">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('mixer')}
              className={cn(
                'text-[10px] font-bold uppercase tracking-[0.2em] transition-colors',
                activeTab === 'mixer' ? 'text-cyan-400' : 'text-gray-600 hover:text-gray-400'
              )}
            >
              Mixer
            </button>
            <button
              onClick={() => setActiveTab('inspector')}
              className={cn(
                'text-[10px] font-bold uppercase tracking-[0.2em] transition-colors',
                activeTab === 'inspector' ? 'text-cyan-400' : 'text-gray-600 hover:text-gray-400'
              )}
            >
              Inspector
            </button>
          </div>
          {activeTab === 'mixer' && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={resetMixer}
              className="text-[9px] font-bold text-gray-600 hover:text-gray-400 uppercase tracking-widest"
            >
              Reset
            </motion.button>
          )}
        </Cluster>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <AnimatePresence mode="wait">
          {activeTab === 'mixer' ? (
            <motion.div
              key="mixer"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-4 space-y-4"
            >
              {(Object.keys(channels) as ChannelType[]).map(type => {
                const channel = channels[type];
                return (
                  <div
                    key={type}
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
                          onClick={() => toggleChannelMute(type)}
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
                          onClick={() => toggleChannelSolo(type)}
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
                        <VUMeter
                          isActive={isSimulating && !channel.muted && (!hasSolo || channel.solo)}
                        />
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
                            onChange={e => setChannelVolume(type, Number(e.target.value))}
                            className="absolute inset-0 w-full opacity-0 cursor-pointer"
                          />
                        </div>
                        <div className="flex justify-between mt-2">
                          <span className="text-[9px] font-mono text-gray-600">Volume</span>
                          <span className="text-[9px] font-mono text-cyan-400">
                            {channel.volume}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          ) : (
            <motion.div
              key="inspector"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-5 space-y-6"
            >
              {selectedSource ? (
                <>
                  <Stack gap={2}>
                    <Cluster gap={2}>
                      <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                        <Music className="w-4 h-4 text-indigo-400" />
                      </div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider truncate">
                        {selectedSource.element.file_name}
                      </h3>
                    </Cluster>
                    <p className="text-[10px] text-gray-600 uppercase font-bold tracking-widest">
                      Channel: {selectedSource.element.channel_type}
                    </p>
                  </Stack>

                  <Stack gap={4}>
                    {/* Gain Control */}
                    <Stack gap={2}>
                      <Cluster justify="between">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                          <Volume2 className="w-3 h-3" /> Element Gain
                        </label>
                        <span className="text-[10px] font-mono text-cyan-400">
                          {(selectedSource.gainNode.gain.value * 100).toFixed(0)}%
                        </span>
                      </Cluster>
                      <input
                        type="range"
                        min="0"
                        max="2"
                        step="0.01"
                        value={selectedSource.gainNode.gain.value}
                        onChange={e => setVolume(selectedSource.element.id, Number(e.target.value))}
                        className="w-full accent-cyan-500"
                      />
                    </Stack>

                    {/* Loop Toggle */}
                    <Stack gap={2}>
                      <Cluster justify="between" align="center">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                          <Timer className="w-3 h-3" /> Behavior
                        </label>
                        <button
                          onClick={() => toggleLoop(selectedSource.element.id)}
                          className={cn(
                            'px-3 py-1 rounded text-[9px] font-bold uppercase transition-all border',
                            selectedSource.isLooping
                              ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_10px_rgba(0,212,255,0.3)]'
                              : 'bg-transparent border-white/10 text-gray-600'
                          )}
                        >
                          Looping
                        </button>
                      </Cluster>
                    </Stack>
                  </Stack>

                  <div className="p-5 bg-white/[0.02] border border-white/5 rounded-xl mt-6">
                    <h4 className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-3">
                      Source Meta
                    </h4>
                    <pre className="text-[8px] font-mono text-gray-700 whitespace-pre-wrap">
                      ID: {selectedSource.element.id}
                      {'\n'}Path: {selectedSource.element.file_path.substring(0, 30)}...
                    </pre>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-center gap-4 opacity-30">
                  <div className="p-4 bg-white/5 rounded-full">
                    <Info className="w-8 h-8 text-gray-500" />
                  </div>
                  <p className="text-xs text-gray-500 font-medium">
                    Select an audio element to
                    <br /> inspect its properties.
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Master Section */}
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
              onChange={e => setMasterVolume(Number(e.target.value))}
              className="absolute inset-0 w-full opacity-0 cursor-pointer"
            />
          </div>
        </Stack>
      </div>
    </Stack>
  );
}
