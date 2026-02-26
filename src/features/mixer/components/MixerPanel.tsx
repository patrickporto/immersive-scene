import { useEffect, useRef, useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { Info, SlidersHorizontal } from 'lucide-react';

import { MixerChannelStrip } from './MixerChannelStrip';
import { MixerInspectorPanel } from './MixerInspectorPanel';
import { MixerMasterSection } from './MixerMasterSection';
import { Cluster } from '../../../shared/components/layout/Cluster';
import { Stack } from '../../../shared/components/layout/Stack';
import { cn } from '../../../shared/utils/cn';
import { useAudioEngineStore } from '../../audio-engine/stores/audioEngineStore';
import { ChannelType, useMixerStore } from '../stores/mixerStore';

interface MixerPanelProps {
  isCollapsed?: boolean;
}

/**
 * @description Displays mixer channels and selected element inspector controls.
 * @param props - Component properties.
 * @param props.isCollapsed - Whether panel is rendered in compact mode.
 * @returns Mixer panel component.
 */
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

  const prevSelectedElementId = useRef<number | null>(null);
  useEffect(() => {
    if (selectedElementId && selectedElementId !== prevSelectedElementId.current) {
      prevSelectedElementId.current = selectedElementId;
      Promise.resolve().then(() => {
        setActiveTab('inspector');
      });
    }
  }, [selectedElementId]);

  const hasSolo = Object.values(channels).some(channel => channel.solo);
  const selectedSource = selectedElementId ? sources.get(selectedElementId) || null : null;

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
              {(Object.keys(channels) as ChannelType[]).map(type => (
                <MixerChannelStrip
                  key={type}
                  type={type}
                  channel={channels[type]}
                  hasSolo={hasSolo}
                  isSimulating={isPlaying}
                  onToggleMute={toggleChannelMute}
                  onToggleSolo={toggleChannelSolo}
                  onVolumeChange={setChannelVolume}
                />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="inspector"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-5 space-y-6"
            >
              <MixerInspectorPanel
                selectedSource={selectedSource}
                onSetVolume={setVolume}
                onToggleLoop={toggleLoop}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <MixerMasterSection masterVolume={masterVolume} onVolumeChange={setMasterVolume} />
    </Stack>
  );
}
